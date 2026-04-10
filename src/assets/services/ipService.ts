/**
 * IP Address Detection Service
 * Attempts to get the user's IP address from various sources
 */

export const getClientIpAddress = async (): Promise<string> => {
  try {
    // Try to get IP from a public IP service
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip || '127.0.0.1';
    }
  } catch (error) {
    console.warn('Failed to fetch public IP:', error);
  }

  // Fallback: Try WebSocket to determine IP
  try {
    const ip = await getIpFromWebRTC();
    if (ip) return ip;
  } catch (error) {
    console.warn('Failed to get IP from WebRTC:', error);
  }

  // Last resort: return localhost
  return '127.0.0.1';
};

/**
 * Attempt to get IP address using WebRTC (for LAN IPs)
 */
const getIpFromWebRTC = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const pc = new (window as any).RTCPeerConnection({ iceServers: [] });
    
    pc.createDataChannel('');
    pc.createOffer()
      .then((offer: any) => pc.setLocalDescription(offer))
      .catch(() => resolve(null));

    pc.onicecandidate = (ice: any) => {
      if (!ice || !ice.candidate) return;
      
      const candidates = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g);
      if (candidates) {
        const ip = candidates[candidates.length - 1];
        pc.close();
        resolve(ip);
      }
    };

    setTimeout(() => {
      pc.close();
      resolve(null);
    }, 1000);
  });
};

/**
 * Get IP address synchronously from RTCPeerConnection (may not work immediately)
 * This is a backup synchronous approach
 */
export const getClientIpAddressSync = (): string => {
  // Try to get from local storage cache
  const cachedIp = localStorage.getItem('clientIp');
  if (cachedIp) {
    return cachedIp;
  }

  // For client-side only code, try WebRTC immediately
  try {
    const pc = new (window as any).RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer()
      .then((offer: any) => {
        pc.setLocalDescription(offer).catch(() => {});
      })
      .catch(() => {});

    pc.onicecandidate = (ice: any) => {
      if (!ice || !ice.candidate) return;
      const candidates = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g);
      if (candidates) {
        const ip = candidates[candidates.length - 1];
        localStorage.setItem('clientIp', ip);
        pc.close();
      }
    };

    setTimeout(() => pc.close(), 1000);
  } catch (error) {
    console.warn('WebRTC not available');
  }

  return '127.0.0.1';
};

/**
 * Device Detection Service
 * Detects device type, browser, and operating system
 */
export const getDeviceInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  // Detect device type
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    deviceType = /iPad/.test(userAgent) ? 'Tablet' : 'Mobile';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (/Windows NT/.test(userAgent)) os = 'Windows';
  else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) os = 'macOS';
  else if (/Linux|X11/.test(userAgent)) os = 'Linux';
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = 'iOS';
  else if (/Android/.test(userAgent)) os = 'Android';
  
  // Detect browser
  let browser = 'Unknown';
  if (/Edg/.test(userAgent)) browser = 'Edge';
  else if (/Chrome/.test(userAgent)) browser = 'Chrome';
  else if (/Firefox/.test(userAgent)) browser = 'Firefox';
  else if (/Safari/.test(userAgent)) browser = 'Safari';
  else if (/Opera|OPR/.test(userAgent)) browser = 'Opera';
  
  return `${deviceType} - ${os} - ${browser}`;
};
