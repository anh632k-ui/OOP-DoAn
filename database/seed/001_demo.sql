-- Idempotent local demonstration data. No passwords, no real login accounts.
BEGIN;
INSERT INTO vai_tro(ma_vai_tro,ten_vai_tro) VALUES
('10000000-0000-4000-8000-000000000001','ADMIN'),
('10000000-0000-4000-8000-000000000002','ORGANIZER'),
('10000000-0000-4000-8000-000000000003','CHECKIN'),
('10000000-0000-4000-8000-000000000004','ATTENDEE')
ON CONFLICT DO NOTHING;
INSERT INTO nguoi_dung(ma_nguoi_dung,email,ho_ten) VALUES
('20000000-0000-4000-8000-000000000001','organizer@example.invalid','Ban to chuc demo'),
('20000000-0000-4000-8000-000000000002','visitor1@example.invalid','Nguoi tham du 1'),
('20000000-0000-4000-8000-000000000003','visitor2@example.invalid','Nguoi tham du 2')
ON CONFLICT DO NOTHING;
INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung,ma_vai_tro) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000004')
ON CONFLICT DO NOTHING;
INSERT INTO dia_diem(ma_dia_diem,ten_dia_diem,dia_chi,mo_ta) VALUES
('30000000-0000-4000-8000-000000000001','Nha Van hoa Thanh nien','04 Pham Ngoc Thach, TP.HCM','Vi du minh hoa, khong xac nhan tien ich'),
('30000000-0000-4000-8000-000000000002','Trung tam van hoa quan','TP.HCM (dia diem gia lap)','Dia diem gia lap cho demo')
ON CONFLICT DO NOTHING;
INSERT INTO su_kien(ma_su_kien,ma_nguoi_to_chuc,ten_su_kien,mo_ta,trang_thai) VALUES
('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Trien lam Di san Van hoa Viet','Trien lam gioi thieu van hoa truyen thong, du lieu demo.','DA_CONG_BO'),
('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Dem nhac Dan gian','Chuong trinh giao luu am nhac, du lieu demo.','DA_CONG_BO')
ON CONFLICT DO NOTHING;
INSERT INTO suat_su_kien(ma_suat,ma_su_kien,ma_dia_diem,bat_dau,ket_thuc,suc_chua,mo_dang_ky,dong_dang_ky,trang_thai) VALUES
('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',now()+interval '30 days',now()+interval '30 days 2 hours',80,now()-interval '1 day',now()+interval '20 days','MO_DANG_KY'),
('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',now()+interval '31 days',now()+interval '31 days 2 hours',200,now()-interval '1 day',now()+interval '20 days','MO_DANG_KY'),
('50000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002',now()+interval '32 days',now()+interval '32 days 2 hours',1,now()-interval '1 day',now()+interval '20 days','MO_DANG_KY')
ON CONFLICT DO NOTHING;
INSERT INTO chinh_sach_phan_bo(ma_chinh_sach,ma_suat,phuong_thuc,cau_hinh) VALUES
('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','FCFS','{}'),
('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','LOTTERY','{}'),
('60000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000003','FCFS','{}')
ON CONFLICT DO NOTHING;
INSERT INTO dac_tinh_tiep_can(ma_dac_tinh,ten_dac_tinh,mo_ta) VALUES
('70000000-0000-4000-8000-000000000001','Duong di xe lan','Can xac nhan truoc khi cong bo'),
('70000000-0000-4000-8000-000000000002','Cho ngoi ho tro','Can xac nhan truoc khi cong bo')
ON CONFLICT DO NOTHING;
COMMIT;
