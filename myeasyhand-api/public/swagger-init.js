(function () {
  function readCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function preauthorize(token) {
    if (!token || !window.ui) {
      return false;
    }

    window.ui.preauthorizeApiKey('bearerAuth', token);
    return true;
  }

  const token = readCookie('swagger_token') || localStorage.getItem('swagger_token');
  if (token) {
    localStorage.setItem('swagger_token', token);
  }

  const interval = setInterval(function () {
    if (preauthorize(token)) {
      clearInterval(interval);
    }
  }, 100);
})();
