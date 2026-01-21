
export const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentTimeStr = () => {
  return new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export const format12h = (timeStr: string) => {
  if (!timeStr || typeof timeStr !== 'string') return '--:--';
  // Handle HH:MM:SS or HH:MM formats
  const parts = timeStr.split(':');
  if (parts.length < 2) return '--:--';
  
  let h = parseInt(parts[0]);
  if (isNaN(h)) return '--:--';
  
  const m = parts[1].padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
};
