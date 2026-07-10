export type ApiErrorItem = { field?: string; message: string };

export type ParsedApiError = {
  message: string;
  fieldErrors: Record<string, string>;
};

export function parseApiValidationError(err: unknown, fallback = 'Request failed'): ParsedApiError {
  const data = (err as { response?: { data?: { message?: string; errors?: ApiErrorItem[] } } })
    ?.response?.data;

  const fieldErrors: Record<string, string> = {};
  if (data?.errors?.length) {
    for (const item of data.errors) {
      if (item.field) {
        fieldErrors[item.field] = item.message.replace(/"/g, "'");
      }
    }
  }

  return {
    message: data?.message || fallback,
    fieldErrors,
  };
}
