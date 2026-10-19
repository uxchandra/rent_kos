-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'TENANT') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(60) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `tagline` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `address` VARCHAR(255) NOT NULL,
    `city` VARCHAR(80) NOT NULL,
    `province` VARCHAR(80) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `gender` ENUM('PUTRA', 'PUTRI', 'CAMPUR') NOT NULL DEFAULT 'CAMPUR',
    `facilities` JSON NULL,
    `rules` TEXT NULL,
    `whatsapp` VARCHAR(20) NULL,
    `cover_image` VARCHAR(191) NULL,
    `default_deposit` INTEGER NOT NULL DEFAULT 0,
    `billing_due_days` INTEGER NOT NULL DEFAULT 7,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kos_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kos_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kos_id` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(150) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `kos_photos_kos_id_idx`(`kos_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kos_admins` (
    `user_id` INTEGER NOT NULL,
    `kos_id` INTEGER NOT NULL,

    PRIMARY KEY (`user_id`, `kos_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kos_id` INTEGER NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `description` TEXT NULL,
    `monthly_price` INTEGER NOT NULL,
    `size` VARCHAR(30) NULL,
    `facilities` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `room_types_kos_id_idx`(`kos_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_type_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_type_id` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `room_type_photos_room_type_id_idx`(`room_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_type_id` INTEGER NOT NULL,
    `number` VARCHAR(20) NOT NULL,
    `floor` INTEGER NULL,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `notes` VARCHAR(255) NULL,

    UNIQUE INDEX `rooms_room_type_id_number_key`(`room_type_id`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `kos_id` INTEGER NOT NULL,
    `room_type_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `occupation` VARCHAR(100) NULL,
    `move_in_date` DATE NOT NULL,
    `message` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `reject_reason` VARCHAR(255) NULL,
    `handled_by_id` INTEGER NULL,
    `handled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bookings_code_key`(`code`),
    INDEX `bookings_kos_id_status_idx`(`kos_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenancies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `booking_id` INTEGER NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `monthly_price` INTEGER NOT NULL,
    `billing_day` INTEGER NOT NULL,
    `deposit_amount` INTEGER NOT NULL DEFAULT 0,
    `deposit_status` ENUM('NONE', 'UNPAID', 'HELD', 'REFUNDED', 'PARTIAL_REFUNDED', 'FORFEITED') NOT NULL DEFAULT 'NONE',
    `deposit_refund_amount` INTEGER NULL,
    `deposit_note` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'ENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenancies_booking_id_key`(`booking_id`),
    INDEX `tenancies_room_id_status_idx`(`room_id`, `status`),
    INDEX `tenancies_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(30) NOT NULL,
    `tenancy_id` INTEGER NOT NULL,
    `type` ENUM('RENT', 'DEPOSIT') NOT NULL,
    `period_year` INTEGER NULL,
    `period_month` INTEGER NULL,
    `amount` INTEGER NOT NULL,
    `due_date` DATE NOT NULL,
    `status` ENUM('UNPAID', 'WAITING_VERIFICATION', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
    `paid_at` DATETIME(3) NULL,
    `reminder_sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invoices_number_key`(`number`),
    INDEX `invoices_status_due_date_idx`(`status`, `due_date`),
    UNIQUE INDEX `invoices_tenancy_id_type_period_year_period_month_key`(`tenancy_id`, `type`, `period_year`, `period_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `bank_account_id` INTEGER NULL,
    `amount` INTEGER NOT NULL,
    `proof_url` VARCHAR(191) NOT NULL,
    `sender_name` VARCHAR(100) NOT NULL,
    `transfer_date` DATE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `note` VARCHAR(255) NULL,
    `verified_by_id` INTEGER NULL,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_invoice_id_idx`(`invoice_id`),
    INDEX `payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kos_id` INTEGER NULL,
    `bank_name` VARCHAR(50) NOT NULL,
    `account_number` VARCHAR(40) NOT NULL,
    `account_name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `channel` ENUM('WHATSAPP', 'EMAIL') NOT NULL,
    `recipient` VARCHAR(150) NOT NULL,
    `subject` VARCHAR(200) NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('SENT', 'FAILED') NOT NULL,
    `error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kos_photos` ADD CONSTRAINT `kos_photos_kos_id_fkey` FOREIGN KEY (`kos_id`) REFERENCES `kos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kos_admins` ADD CONSTRAINT `kos_admins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kos_admins` ADD CONSTRAINT `kos_admins_kos_id_fkey` FOREIGN KEY (`kos_id`) REFERENCES `kos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_types` ADD CONSTRAINT `room_types_kos_id_fkey` FOREIGN KEY (`kos_id`) REFERENCES `kos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_type_photos` ADD CONSTRAINT `room_type_photos_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_kos_id_fkey` FOREIGN KEY (`kos_id`) REFERENCES `kos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_handled_by_id_fkey` FOREIGN KEY (`handled_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenancies` ADD CONSTRAINT `tenancies_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenancies` ADD CONSTRAINT `tenancies_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenancies` ADD CONSTRAINT `tenancies_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_tenancy_id_fkey` FOREIGN KEY (`tenancy_id`) REFERENCES `tenancies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_bank_account_id_fkey` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_verified_by_id_fkey` FOREIGN KEY (`verified_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_kos_id_fkey` FOREIGN KEY (`kos_id`) REFERENCES `kos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
