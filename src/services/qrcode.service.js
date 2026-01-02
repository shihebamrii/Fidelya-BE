import QRCode from 'qrcode';

/**
 * Generate QR Code Data URL
 * @param {string} businessSlug - Business slug
 * @param {string} clientId - Client ID string
 * @param {Object} options - QR code options
 * @returns {Promise<string>} QR Code Data URL
 */
const generateQRDataUrl = async (businessSlug, clientId, options = {}) => {
  // Generate URL pointing to client dashboard
  // Format: /:businessSlug/client/:clientId
  const dashboardUrl = process.env.CLIENT_DASHBOARD_URL || 'http://localhost:4000';
  const url = `${dashboardUrl}/${businessSlug}/client/${clientId}`;

  const qrOptions = {
    type: 'image/png',
    width: options.width || 300,
    margin: options.margin || 2,
    color: {
      dark: options.darkColor || '#000000',
      light: options.lightColor || '#FFFFFF'
    },
    errorCorrectionLevel: 'H' // High error correction for durability
  };

  try {
    const dataUrl = await QRCode.toDataURL(url, qrOptions);
    return dataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

/**
 * Generate QR code as buffer (for file saving)
 * @param {string} clientId - Client ID to encode
 * @param {Object} options - QR code options
 * @returns {Promise<Buffer>} PNG buffer
 */
const generateQRBuffer = async (businessSlug, clientId, options = {}) => {
  const dashboardUrl = process.env.CLIENT_DASHBOARD_URL || 'http://localhost:4000';
  const url = `${dashboardUrl}/${businessSlug}/client/${clientId}`;

  const qrOptions = {
    type: 'png',
    width: options.width || 300,
    margin: options.margin || 2,
    color: {
      dark: options.darkColor || '#000000',
      light: options.lightColor || '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  };

  try {
    const buffer = await QRCode.toBuffer(url, qrOptions);
    return buffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code buffer: ${error.message}`);
  }
};

/**
 * Get the URL that would be encoded in the QR code
 * @param {string} clientId - Client ID
 * @returns {string} Dashboard URL
 */
const getClientDashboardUrl = (businessSlug, clientId) => {
  const dashboardUrl = process.env.CLIENT_DASHBOARD_URL || 'http://localhost:4000';
  return `${dashboardUrl}/${businessSlug}/client/${clientId}`;
};

export { generateQRDataUrl, generateQRBuffer, getClientDashboardUrl };
