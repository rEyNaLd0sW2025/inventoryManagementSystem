import { Notification } from "../types";
import { notifications as mockNotifications } from "../data/mockData";

export const createNotification = (
  payload: Omit<Notification, "id" | "date">
) => {
  const id = `n_${Date.now()}`;
  const date = new Date().toISOString();
  const notification: Notification = {
    id,
    date,
    read: false,
    ...payload,
  } as Notification;

  // Push into in-memory mock notifications so UI que las consuma en desarrollo
  try {
    mockNotifications.unshift(notification);
  } catch (e) {
    // si no es mutable, al menos loguear
    // eslint-disable-next-line no-console
    console.log("Notification:", notification);
  }

  return notification;
};
