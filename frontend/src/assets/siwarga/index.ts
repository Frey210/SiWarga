import logoFull from "./logo_siwarga_full.png";
import logoMark from "./logo_siwarga_mark.png";
import icArsip from "./ic_arsip.png";
import icDashboard from "./ic_dashboard.png";
import icDataWarga from "./ic_data-warga.png";
import icPengumuman from "./ic_pengumuman.png";
import icPengguna from "./ic_pengguna.png";
import icPermohonanSurat from "./ic_permohonan-surat.png";
import icSettings from "./ic_settings.png";
import icTemplateSurat from "./ic_template-surat.png";
import icStatusDiajukan from "./ic_status-diajukan.png";
import icStatusDiproses from "./ic_status-diproses.png";
import icStatusPerluPerbaikan from "./ic_status-perlu-perbaikan.png";
import icStatusDisetujui from "./ic_status-disetujui.png";
import icStatusDitolak from "./ic_status-ditolak.png";

export const SIWARGA_LOGOS = {
  full: logoFull,
  mark: logoMark
};

export const MENU_ICONS = {
  dashboard: icDashboard,
  warga: icDataWarga,
  surat: icPermohonanSurat,
  pengumuman: icPengumuman,
  template: icTemplateSurat,
  pengguna: icPengguna,
  settings: icSettings,
  arsip: icArsip
};

export const STATUS_ICONS = {
  SUBMITTED: icStatusDiajukan,
  PROCESSING: icStatusDiproses,
  REVISION: icStatusPerluPerbaikan,
  APPROVED: icStatusDisetujui,
  REJECTED: icStatusDitolak
};
