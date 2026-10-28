import type { KosGender } from "./types";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

export const roomStatusLabel: Record<RoomStatus, string> = {
  AVAILABLE: "Kosong",
  OCCUPIED: "Terisi",
  MAINTENANCE: "Perbaikan",
};

export const roomStatusStyle: Record<RoomStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-600/20",
  OCCUPIED: "bg-accent text-foreground border-border",
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
  comingSoon: boolean;
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
  area: string | null;
  areaImage: string | null;
  areaImageCredit: string | null;
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
  comingSoon: boolean;
  photos: { id: number; url: string; caption: string | null }[];
  admins: { id: number; name: string; email: string; phone: string | null }[];
  roomTypes: AdminRoomType[];
};

export type DashboardTrendPoint = {
  year: number;
  month: number;
  billed: number;
  collected: number;
  cashIn: number;
  bookings: number;
  approved: number;
  moveIns: number;
  moveOuts: number;
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
    pendingPayments: number;
    activeTenants: number;
    overdueAmount: number;
    overdueCount: number;
  };
  /** Tagihan sewa periode bulan ini, dikelompokkan per status. */
  thisMonth: {
    billed: number;
    paid: number;
    paidCount: number;
    waiting: number;
    waitingCount: number;
    unpaid: number;
    unpaidCount: number;
    overdue: number;
    overdueCount: number;
  };
  /** 6 bulan terakhir, urut dari yang terlama. */
  trend: DashboardTrendPoint[];
  overdue: {
    id: number;
    number: string;
    amount: number;
    dueDate: string;
    daysLate: number;
    status: InvoiceStatus;
    tenantName: string;
    kosName: string;
    roomNumber: string;
  }[];
  recentBookings: {
    id: number;
    code: string;
    name: string;
    status: BookingStatus;
    createdAt: string;
    moveInDate: string;
    kosName: string;
    roomTypeName: string;
  }[];
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
  defaultDeposit: number;
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
  role: "OWNER" | "ADMIN" | "TENANT";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  staffRole: { id: number; name: string } | null;
  permissionCount: number;
  kos: { id: number; name: string; city: string }[];
  /** Penghuni: kamar yang sedang ditempati. */
  stay: { roomNumber: string; kos: { id: number; name: string } } | null;
};

export type StaffRole = {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
};

export type PermissionCatalog = {
  groups: { key: string; label: string; permissions: { key: string; label: string }[] }[];
  ownerOnly: string[];
  all: string[];
};

export type ActivityEntry = {
  id: number;
  userId: number | null;
  userName: string;
  action: string;
  label: string;
  target: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export type ActivityPage = {
  data: ActivityEntry[];
  meta: { total: number; page: number; pageSize: number; pages: number };
  users: { userId: number; userName: string }[];
};

export type DepositStatus = "NONE" | "UNPAID" | "HELD" | "REFUNDED" | "PARTIAL_REFUNDED" | "FORFEITED";

export const depositStatusLabel: Record<DepositStatus, string> = {
  NONE: "Tanpa deposit",
  UNPAID: "Belum dibayar",
  HELD: "Ditahan",
  REFUNDED: "Dikembalikan",
  PARTIAL_REFUNDED: "Dikembalikan sebagian",
  FORFEITED: "Hangus",
};

export type Tenancy = {
  id: number;
  startDate: string;
  endDate: string | null;
  monthlyPrice: number;
  billingDay: number;
  depositAmount: number;
  depositStatus: DepositStatus;
  depositRefundAmount: number | null;
  depositNote: string | null;
  status: "ACTIVE" | "ENDED";
  tenant: { id: number; name: string; email: string; phone: string | null };
  room: { id: number; number: string; floor: number | null; typeName: string };
  kos: { id: number; name: string; city: string };
  unpaidInvoices: number;
};

export type InvoiceStatus = "UNPAID" | "WAITING_VERIFICATION" | "PAID" | "CANCELLED";

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  UNPAID: "Belum bayar",
  WAITING_VERIFICATION: "Menunggu verifikasi",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
};

export const invoiceStatusStyle: Record<InvoiceStatus, string> = {
  UNPAID: "bg-amber-50 text-amber-700",
  WAITING_VERIFICATION: "bg-sky-50 text-sky-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-muted text-muted-foreground",
};

export type Invoice = {
  id: number;
  number: string;
  type: "RENT" | "DEPOSIT";
  periodYear: number | null;
  periodMonth: number | null;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  paidAt: string | null;
  reminderSentAt: string | null;
  tenancyId: number;
  tenancyEnded: boolean;
  tenant: { id: number; name: string; phone: string | null };
  roomNumber: string;
  kos: { id: number; name: string };
};

export type InvoiceList = {
  data: Invoice[];
  meta: { year: number; month: number; today: string; unbilled: number };
};

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BankAccount = { id: number; bankName: string; accountNumber: string; accountName: string };

export type AdminBankAccount = BankAccount & { isActive: boolean; kos: { id: number; name: string } | null };

export type AdminPayment = {
  id: number;
  amount: number;
  proofUrl: string;
  senderName: string;
  transferDate: string;
  status: PaymentStatus;
  note: string | null;
  verifiedAt: string | null;
  createdAt: string;
  bankAccount: { bankName: string; accountNumber: string; accountName: string } | null;
  verifiedBy: { name: string } | null;
  invoice: Pick<Invoice, "id" | "number" | "type" | "periodYear" | "periodMonth" | "amount" | "dueDate" | "status">;
  tenant: { name: string; phone: string | null };
  roomNumber: string;
  kos: { id: number; name: string };
};

/** Data halaman /penghuni. */
export type TenantOverview = {
  tenancy: {
    id: number;
    startDate: string;
    monthlyPrice: number;
    billingDay: number;
    depositAmount: number;
    depositStatus: DepositStatus;
    room: { number: string; typeName: string };
    kos: { id: number; name: string; city: string; address: string; whatsapp: string | null };
  } | null;
  invoices: (Pick<Invoice, "id" | "number" | "type" | "periodYear" | "periodMonth" | "amount" | "dueDate" | "status" | "paidAt"> & {
    lastPayment: { status: PaymentStatus; note: string | null; createdAt: string } | null;
  })[];
  bankAccounts: BankAccount[];
  today: string;
};

export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type AdminBooking = {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  occupation: string | null;
  moveInDate: string;
  message: string | null;
  status: BookingStatus;
  rejectReason: string | null;
  handledAt: string | null;
  createdAt: string;
  handledBy: { name: string } | null;
  kos: { id: number; name: string };
  roomType: { id: number; name: string; monthlyPrice: number; availableRooms: number };
  tenancyId: number | null;
};

export type Report = {
  year: number;
  firstYear: number;
  currentYear: number;
  months: { month: number; billed: number; collected: number; cashRent: number; cashDeposit: number; moveIns: number; moveOuts: number }[];
  kos: { id: number; name: string; totalRooms: number; occupied: number; billed: number; collected: number }[];
  arrears: { tenancyId: number; name: string; phone: string | null; kosName: string; roomNumber: string; ended: boolean; count: number; amount: number; oldestDue: string }[];
  snapshot: { activeTenants: number; depositsHeld: number; overdueAmount: number };
};
