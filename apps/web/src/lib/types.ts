export type KosGender = "PUTRA" | "PUTRI" | "CAMPUR";
export type Role = "OWNER" | "ADMIN" | "TENANT";

export type KosSummary = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  city: string;
  address: string;
  gender: KosGender;
  coverImage: string | null;
  facilities: string[] | null;
  latitude: number | null;
  longitude: number | null;
  minPrice: number | null;
  totalRooms: number;
  availableRooms: number;
};

export type RoomType = {
  id: number;
  name: string;
  description: string | null;
  monthlyPrice: number;
  size: string | null;
  facilities: string[] | null;
  photos: { id: number; url: string }[];
  totalRooms: number;
  availableRooms: number;
};

export type KosDetail = Omit<KosSummary, "minPrice" | "availableRooms" | "totalRooms"> & {
  description: string | null;
  province: string | null;
  rules: string | null;
  nearby: { name: string; distance: string }[] | null;
  whatsapp: string | null;
  managerName: string | null;
  defaultDeposit: number;
  photos: { id: number; url: string; caption: string | null }[];
  roomTypes: RoomType[];
};

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  /** Peran custom untuk akun ADMIN; null untuk OWNER. */
  staffRole: { id: number; name: string } | null;
  /** Izin efektif dari server (OWNER: semua). */
  permissions: string[];
  kos: { id: number; name: string; slug: string }[];
};

export type RoomListing = RoomType & {
  kos: { slug: string; name: string; city: string; address: string; gender: KosGender; coverImage: string | null };
};
