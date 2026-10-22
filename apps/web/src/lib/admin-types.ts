import type { KosGender } from "./types";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

export const roomStatusLabel: Record<RoomStatus, string> = {
  AVAILABLE: "Kosong",
  OCCUPIED: "Terisi",
  MAINTENANCE: "Perbaikan",
};

export const roomStatusStyle: Record<RoomStatus, string> = {
  AVAILABLE: "bg-mint text-mint-ink border-mint-ink/20",
  OCCUPIED: "bg-lavender text-brand-700 border-brand-300",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-300",
};

export type AdminKosSummary = {
  id: number;
  slug: string;
  name: string;
  city: string;
  gender: KosGender;
  coverImage: string | null;
  isPublished: boolean;
  roomTypeCount: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
};

export type AdminRoom = {
  id: number;
  number: string;
  floor: number | null;
  status: RoomStatus;
  notes: string | null;
  hasActiveTenancy: boolean;
};

export type AdminRoomType = {
  id: number;
  name: string;
  description: string | null;
  monthlyPrice: number;
  size: string | null;
  facilities: string[] | null;
  isActive: boolean;
  photos: { id: number; url: string }[];
  rooms: AdminRoom[];
};

export type AdminKosDetail = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string;
  city: string;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  gender: KosGender;
  facilities: string[] | null;
  rules: string | null;
  nearby: { name: string; distance: string }[] | null;
  whatsapp: string | null;
  coverImage: string | null;
  defaultDeposit: number;
  billingDueDays: number;
  isPublished: boolean;
  photos: { id: number; url: string; caption: string | null }[];
  admins: { id: number; name: string; email: string; phone: string | null }[];
  roomTypes: AdminRoomType[];
};

export type Dashboard = {
  totals: {
    kos: number;
    totalRooms: number;
    occupied: number;
    available: number;
    maintenance: number;
    potentialRevenue: number;
    pendingBookings: number;
  };
  kos: {
    id: number;
    name: string;
    city: string;
    slug: string;
    isPublished: boolean;
    coverImage: string | null;
    totalRooms: number;
    occupied: number;
    available: number;
    maintenance: number;
    potentialRevenue: number;
  }[];
};

export type RoomBoard = {
  id: number;
  name: string;
  city: string;
  roomTypes: {
    id: number;
    name: string;
    monthlyPrice: number;
    rooms: { id: number; number: string; floor: number | null; status: RoomStatus; notes: string | null; tenantName: string | null }[];
  }[];
}[];

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  kos: { id: number; name: string; city: string }[];
};
