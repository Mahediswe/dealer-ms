import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { AlertTriangle, Wallet } from 'lucide-react';
import { SOCKET_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ICONS = {
  low_stock: AlertTriangle,
  payment_received: Wallet,
};

export function useLiveNotifications(onNotification) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.company_id) return undefined;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('join', user.company_id));

    socket.on('notification', (notification) => {
      const Icon = ICONS[notification.type];
      toast(notification.title, {
        icon: Icon ? <Icon size={16} className="text-teal-600" /> : undefined,
      });
      onNotification?.(notification);
    });

    return () => socket.disconnect();
  }, [user?.company_id]);
}
