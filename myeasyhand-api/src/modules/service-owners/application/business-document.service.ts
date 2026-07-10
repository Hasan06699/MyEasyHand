import { Types } from 'mongoose';
import { Request } from 'express';
import {
  BusinessDocument,
  BusinessDocumentCategory,
  IBusinessDocument,
} from '../../../database/models/business-document.model';
import { Business } from '../../../database/models/business.model';
import { OwnerProfile } from '../../../database/models/owner-profile.model';
import { OwnerPaymentInfo } from '../../../database/models/owner-payment-info.model';
import { ImageService } from '../../../services/image.service';
import { NotificationService } from '../../../services/notification.service';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../common/errors/AppError';
import { AuditLogService } from '../../audit/application/audit-log.service';

export class BusinessDocumentService {
  static async list(req: Request) {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (req.user?.roles.includes('super_admin')) {
      if (req.query.ownerId) {
        const business = await Business.findOne({ ownerId: req.query.ownerId, isDeleted: false });
        if (business) filter.businessId = business._id;
      }
      if (req.query.status) filter.status = req.query.status;
      if (req.query.category) filter.category = req.query.category;
    } else if (req.user?.roles.includes('business_owner') && req.user.businessId) {
      filter.businessId = req.user.businessId;
      if (req.query.category) filter.category = req.query.category;
    } else {
      throw new ForbiddenError();
    }

    return BusinessDocument.find(filter)
      .populate('ownerId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  static async upload(
    req: Request,
    data: { type: string; filePath: string; fileName: string; category?: string; expiresAt?: string },
  ) {
    if (!req.user?.roles.includes('business_owner') || !req.user.businessId) {
      throw new ForbiddenError('Only business owners can upload documents');
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) throw new NotFoundError('Business not found');

    const category = (data.category || 'business') as BusinessDocumentCategory;
    const doc = await BusinessDocument.create({
      businessId: business._id,
      ownerId: new Types.ObjectId(req.user.id),
      category,
      type: data.type,
      filePath: data.filePath,
      fileName: data.fileName,
      status: 'pending',
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    await this.syncVerificationStatus(req.user.id, req.user.businessId);

    await NotificationService.notifyBusinessOwner(req.user.businessId, {
      type: 'document_submitted',
      title: 'Document submitted',
      body: `Your ${data.type} has been submitted and is pending verification.`,
      data: { documentId: doc._id.toString(), type: data.type, category },
    });

    return doc;
  }

  static async approve(req: Request, id: string, remarks?: string) {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can approve documents');
    }

    const doc = await BusinessDocument.findOne({ _id: id, isDeleted: false });
    if (!doc) throw new NotFoundError('Document not found');
    if (doc.status !== 'pending') {
      throw new ConflictError('Only pending documents can be approved');
    }

    doc.status = 'approved';
    doc.reviewedBy = new Types.ObjectId(req.user.id);
    doc.reviewedAt = new Date();
    if (remarks) doc.remarks = remarks;
    await doc.save();

    await AuditLogService.log({
      req,
      adminId: req.user.id,
      ownerId: doc.ownerId.toString(),
      businessId: doc.businessId.toString(),
      module: 'business_document',
      action: 'document_approved',
      resourceId: doc._id.toString(),
      approvalStatus: 'approved',
      remarks,
    });

    await this.syncVerificationStatus(doc.ownerId.toString(), doc.businessId.toString());

    await NotificationService.notify({
      userId: doc.ownerId.toString(),
      businessId: doc.businessId.toString(),
      type: 'document_approved',
      title: 'Document approved',
      body: `Your ${doc.type} has been verified and approved.`,
      data: { documentId: doc._id.toString(), type: doc.type, category: doc.category },
    });

    const profile = await OwnerProfile.findOne({ userId: doc.ownerId });
    if (profile?.kycStatus === 'approved' && doc.category === 'identity') {
      await NotificationService.notify({
        userId: doc.ownerId.toString(),
        businessId: doc.businessId.toString(),
        type: 'kyc_completed',
        title: 'KYC verification completed',
        body: 'Your identity verification is complete. You can now access all platform features.',
      });
    }

    const payment = await OwnerPaymentInfo.findOne({ businessId: doc.businessId });
    if (payment?.bankVerificationStatus === 'approved' && doc.category === 'bank') {
      await NotificationService.notify({
        userId: doc.ownerId.toString(),
        businessId: doc.businessId.toString(),
        type: 'bank_verification_completed',
        title: 'Bank verification completed',
        body: 'Your bank account has been verified. Payouts can now be processed.',
      });
    }

    return doc;
  }

  static async reject(req: Request, id: string, remarks?: string) {
    if (!req.user?.roles.includes('super_admin')) {
      throw new ForbiddenError('Only super admin can reject documents');
    }

    const doc = await BusinessDocument.findOne({ _id: id, isDeleted: false });
    if (!doc) throw new NotFoundError('Document not found');
    if (doc.status !== 'pending') {
      throw new ConflictError('Only pending documents can be rejected');
    }

    doc.status = 'rejected';
    doc.reviewedBy = new Types.ObjectId(req.user.id);
    doc.reviewedAt = new Date();
    if (remarks) doc.remarks = remarks;
    await doc.save();

    await AuditLogService.log({
      req,
      adminId: req.user.id,
      ownerId: doc.ownerId.toString(),
      businessId: doc.businessId.toString(),
      module: 'business_document',
      action: 'document_rejected',
      resourceId: doc._id.toString(),
      approvalStatus: 'rejected',
      remarks,
    });

    await this.syncVerificationStatus(doc.ownerId.toString(), doc.businessId.toString());

    await NotificationService.notify({
      userId: doc.ownerId.toString(),
      businessId: doc.businessId.toString(),
      type: 'document_rejected',
      title: 'Document rejected',
      body: remarks
        ? `Your ${doc.type} was rejected: ${remarks}. Please re-upload a valid document.`
        : `Your ${doc.type} was rejected. Please re-upload a valid document.`,
      data: { documentId: doc._id.toString(), type: doc.type, category: doc.category, remarks },
    });

    return doc;
  }

  private static async syncVerificationStatus(ownerId: string, businessId: string) {
    const [profile, payment, documents] = await Promise.all([
      OwnerProfile.findOne({ userId: ownerId }),
      OwnerPaymentInfo.findOne({ businessId }),
      BusinessDocument.find({ businessId, isDeleted: false }),
    ]);

    const identityDocs = documents.filter((doc) => doc.category === 'identity');
    const bankDocs = documents.filter((doc) => doc.category === 'bank');

    if (profile) {
      if (identityDocs.some((doc) => doc.status === 'rejected')) {
        profile.kycStatus = 'rejected';
      } else if (
        identityDocs.length > 0 &&
        identityDocs.every((doc) => doc.status === 'approved')
      ) {
        profile.kycStatus = 'approved';
      } else if (identityDocs.some((doc) => doc.status === 'pending')) {
        profile.kycStatus = 'under_review';
      }
      await profile.save();
    }

    if (payment) {
      if (bankDocs.some((doc) => doc.status === 'rejected')) {
        payment.bankVerificationStatus = 'rejected';
      } else if (bankDocs.some((doc) => doc.status === 'approved')) {
        payment.bankVerificationStatus = 'approved';
      } else if (bankDocs.some((doc) => doc.status === 'pending')) {
        payment.bankVerificationStatus = 'under_review';
      }
      await payment.save();
    }
  }
}
