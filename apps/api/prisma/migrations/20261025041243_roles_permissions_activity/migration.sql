-- AlterTable
ALTER TABLE `users` ADD COLUMN `last_login_at` DATETIME(3) NULL,
    ADD COLUMN `staff_role_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `staff_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(60) NOT NULL,
    `description` VARCHAR(255) NULL,
    `permissions` JSON NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `user_name` VARCHAR(100) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `label` VARCHAR(160) NOT NULL,
    `target` VARCHAR(160) NULL,
    `meta` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_created_at_idx`(`created_at`),
    INDEX `activity_logs_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_staff_role_id_idx` ON `users`(`staff_role_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_staff_role_id_fkey` FOREIGN KEY (`staff_role_id`) REFERENCES `staff_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Data: peran bawaan. "Admin Cabang" berisi semua izin agar admin lama tetap bisa bekerja seperti sebelumnya.
INSERT INTO `staff_roles` (`name`, `description`, `permissions`, `is_system`, `updated_at`) VALUES
  ('Admin Cabang', 'Mengelola semua operasional di cabang yang ditugaskan.',
   JSON_ARRAY('dashboard.view','rooms.view','rooms.update','bookings.view','bookings.manage','tenants.view','tenants.create','tenants.update','tenants.checkout','invoices.view','invoices.manage','payments.view','payments.verify','reports.view','kos.view','kos.update'),
   true, CURRENT_TIMESTAMP(3)),
  ('Keuangan', 'Mengurus tagihan, verifikasi pembayaran, dan laporan.',
   JSON_ARRAY('dashboard.view','tenants.view','invoices.view','invoices.manage','payments.view','payments.verify','reports.view'),
   false, CURRENT_TIMESTAMP(3)),
  ('Staf Kamar', 'Memperbarui status kamar dan melihat booking.',
   JSON_ARRAY('dashboard.view','rooms.view','rooms.update','bookings.view'),
   false, CURRENT_TIMESTAMP(3));

UPDATE `users` SET `staff_role_id` = (SELECT `id` FROM `staff_roles` WHERE `name` = 'Admin Cabang') WHERE `role` = 'ADMIN';
