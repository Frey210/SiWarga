
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Home,
  LayoutGrid,
  LogOut,
  Megaphone,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Users,
  XCircle
} from "lucide-react";
import "./index.css";

const TOKEN_KEY = "rw_admin_token";

const LETTER_TYPES = [
  "Surat Pengantar KTP",
  "Surat Pengantar KK",
  "Surat Pengantar Domisili",
  "Surat Pengantar SKCK",
  "Surat Pengantar Nikah",
  "Surat Pengantar Usaha (UMKM)",
  "Surat Pengantar Tidak Mampu"
];

const ACTION_OPTIONS = [
  { value: "SET_IN_REVIEW", label: "Proses Pengajuan" },
  { value: "APPROVE", label: "Setujui Pengajuan" },
  { value: "REJECT", label: "Tolak Pengajuan" },
  { value: "REQUEST_REVISION", label: "Minta Perbaikan" }
];

const emptyAnnouncementDraft = {
  id: null,
  slug: "",
  title: "Judul Pengumuman Baru",
  excerpt: "Tulis ringkasan singkat agar warga paham inti informasi.",
  category: "Informasi",
  content: "# Judul Pengumuman\nIsi detail pengumuman di sini.",
  status: "DRAFT",
  coverUrl: "",
  coverName: "",
  coverFocus: "center",
  publishedAt: null,
  createdAt: null,
  updatedAt: null,
  authorName: ""
};

const REQUIREMENTS_BY_TYPE = {
  "Surat Pengantar KTP": ["Fotokopi Kartu Keluarga", "Fotokopi KTP lama (jika ada)"],
  "Surat Pengantar KK": [
    "Fotokopi KTP kepala keluarga",
    "Fotokopi KK lama",
    "Surat keterangan perubahan (lahir/meninggal/pindah) jika ada"
  ],
  "Surat Pengantar Domisili": ["Fotokopi KTP", "Fotokopi KK", "Surat pernyataan domisili (opsional)"],
  "Surat Pengantar SKCK": ["Fotokopi KTP", "Fotokopi KK", "Pas foto (opsional)"],
  "Surat Pengantar Nikah": ["Fotokopi KTP calon", "Fotokopi KK", "Surat pengantar RT (opsional)"],
  "Surat Pengantar Usaha (UMKM)": ["Fotokopi KTP", "Fotokopi KK", "Surat pernyataan usaha sederhana"],
  "Surat Pengantar Tidak Mampu": ["Fotokopi KTP", "Fotokopi KK", "Surat keterangan tidak mampu (opsional)"]
};

const normalizeDocType = (value) => (value || "").trim().toLowerCase();

function parseHash() {
  const hash = window.location.hash.replace("#", "");
  if (!hash || hash === "/") {
    return { name: "dashboard" };
  }

  if (hash === "/warga/pengumuman") {
    return { name: "warga-announcements" };
  }

  if (hash.startsWith("/warga/pengumuman/")) {
    const slug = decodeURIComponent(hash.replace("/warga/pengumuman/", ""));
    return { name: "warga-announcement-detail", slug };
  }

  if (hash === "/submissions/new") {
    return { name: "submission-new" };
  }

  if (hash.startsWith("/submissions/")) {
    const id = Number(hash.replace("/submissions/", ""));
    return { name: "submission-detail", id };
  }

  if (hash === "/admin") {
    return { name: "admin-list" };
  }

  if (hash === "/admin/pengumuman") {
    return { name: "admin-announcements" };
  }

  if (hash.startsWith("/admin/")) {
    const id = Number(hash.replace("/admin/", ""));
    return { name: "admin-detail", id };
  }

  return { name: "dashboard" };
}

function setHash(path) {
  window.location.hash = path;
}

function App() {
  const cmsEditorRef = useRef(null);
  const [health, setHealth] = useState("loading");
  const [healthError, setHealthError] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nik, setNik] = useState("");
  const [kkNumber, setKkNumber] = useState("");
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [me, setMe] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [route, setRoute] = useState(() => parseHash());

  const [submissions, setSubmissions] = useState([]);
  const [adminSubmissions, setAdminSubmissions] = useState([]);
  const [submissionDetail, setSubmissionDetail] = useState(null);
  const [adminDetail, setAdminDetail] = useState(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isLoadingAdminSubmissions, setIsLoadingAdminSubmissions] = useState(false);
  const [isLoadingSubmissionDetail, setIsLoadingSubmissionDetail] = useState(false);
  const [isLoadingAdminDetail, setIsLoadingAdminDetail] = useState(false);

  const [newType, setNewType] = useState(LETTER_TYPES[0]);
  const [newNote, setNewNote] = useState("");
  const [newError, setNewError] = useState("");
  const [newNotice, setNewNotice] = useState("");

  const [uploadFile, setUploadFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");

  const [action, setAction] = useState("SET_IN_REVIEW");
  const [actionNote, setActionNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");

  const [cmsAnnouncements, setCmsAnnouncements] = useState([]);
  const [cmsDraft, setCmsDraft] = useState(() => ({ ...emptyAnnouncementDraft }));
  const [cmsNotice, setCmsNotice] = useState("");
  const [cmsError, setCmsError] = useState("");
  const [cmsFilter, setCmsFilter] = useState("ALL");
  const [cmsLoading, setCmsLoading] = useState(false);

  const [publicAnnouncements, setPublicAnnouncements] = useState([]);
  const [publicAnnouncement, setPublicAnnouncement] = useState(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");

  const isAdmin = useMemo(() => me?.role === "ADMIN_RW", [me]);
  const mapAnnouncement = (item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
    category: item.category,
    content: item.content || "",
    status: item.status,
    coverUrl: item.cover_url || "",
    coverName: item.cover_name || "",
    coverFocus: item.cover_focus || "center",
    publishedAt: item.published_at || null,
    createdAt: item.created_at || null,
    updatedAt: item.updated_at || null,
    authorName: item.author_name || ""
  });

  const publishedAnnouncements = useMemo(
    () => cmsAnnouncements.filter((item) => item.status === "PUBLISHED"),
    [cmsAnnouncements]
  );
  const cmsCounts = useMemo(() => {
    const counts = { ALL: cmsAnnouncements.length, PUBLISHED: 0, DRAFT: 0, ARCHIVED: 0 };
    cmsAnnouncements.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status] += 1;
      }
    });
    return counts;
  }, [cmsAnnouncements]);
  const filteredCmsAnnouncements = useMemo(() => {
    if (cmsFilter === "ALL") {
      return cmsAnnouncements;
    }
    return cmsAnnouncements.filter((item) => item.status === cmsFilter);
  }, [cmsAnnouncements, cmsFilter]);
  const currentAnnouncement = useMemo(() => {
    if (isAdmin) {
      return cmsAnnouncements.find((item) => item.slug === route.slug) || null;
    }
    return publicAnnouncement;
  }, [cmsAnnouncements, isAdmin, publicAnnouncement, route.slug]);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/health")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setHealth(data.status || "unknown");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setHealthError(err.message || "failed to fetch");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setMe(null);
      return;
    }

    fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            setToken("");
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setMe(data))
      .catch((err) => setAuthError(err.message || "failed to load profile"));
  }, [token]);

  const syncCmsAnnouncement = (payload) => {
    const mapped = mapAnnouncement(payload);
    setCmsAnnouncements((prev) => {
      const exists = prev.some((item) => item.id === mapped.id);
      if (!exists) {
        return [mapped, ...prev];
      }
      return prev.map((item) => (item.id === mapped.id ? mapped : item));
    });
    setCmsDraft(mapped);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        setToken(data.access_token);
        setPassword("");
      })
      .catch((err) => setAuthError(err.message || "login failed"));
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber,
        nik,
        kk_number: kkNumber
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        setAuthMode("login");
        setAuthNotice("Akun berhasil dibuat. Silakan masuk.");
        setPassword("");
      })
      .catch((err) => setAuthError(err.message || "registration failed"));
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setMe(null);
    setHash("/");
  };

  const fetchWithAuth = (path, options = {}) => {
    return fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  };

  useEffect(() => {
    if (!token || !me) {
      return;
    }

    if (route.name === "dashboard") {
      if (isAdmin) {
        setIsLoadingAdminSubmissions(true);
        fetchWithAuth("/api/admin/submissions")
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
          })
          .then((data) => setAdminSubmissions(data))
          .finally(() => setIsLoadingAdminSubmissions(false))
          .catch((err) => setAuthError(err.message || "failed to load admin list"));
      } else {
        setIsLoadingSubmissions(true);
        fetchWithAuth("/api/submissions")
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
          })
          .then((data) => setSubmissions(data))
          .finally(() => setIsLoadingSubmissions(false))
          .catch((err) => setAuthError(err.message || "failed to load submissions"));
      }
    }

    if (route.name === "admin-list" && isAdmin) {
      setIsLoadingAdminSubmissions(true);
      fetchWithAuth("/api/admin/submissions")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setAdminSubmissions(data))
        .finally(() => setIsLoadingAdminSubmissions(false))
        .catch((err) => setAuthError(err.message || "failed to load admin list"));
    }

    if (route.name === "submission-detail") {
      setIsLoadingSubmissionDetail(true);
      setSubmissionDetail(null);
      fetchWithAuth(`/api/submissions/${route.id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setSubmissionDetail(data))
        .finally(() => setIsLoadingSubmissionDetail(false))
        .catch((err) => setAuthError(err.message || "failed to load submission"));
    }

    if (route.name === "admin-detail" && isAdmin) {
      setIsLoadingAdminDetail(true);
      setAdminDetail(null);
      fetchWithAuth(`/api/admin/submissions/${route.id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setAdminDetail(data))
        .finally(() => setIsLoadingAdminDetail(false))
        .catch((err) => setAuthError(err.message || "failed to load admin detail"));
    }
  }, [route, token, me, isAdmin]);

  useEffect(() => {
    if (!token || !isAdmin || route.name !== "admin-announcements") {
      return;
    }
    setCmsLoading(true);
    setCmsError("");
    fetchWithAuth("/api/admin/announcements")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setCmsAnnouncements(data.map(mapAnnouncement)))
      .catch((err) => setCmsError(err.message || "Gagal memuat pengumuman."))
      .finally(() => setCmsLoading(false));
  }, [route.name, isAdmin, token]);

  useEffect(() => {
    if (route.name !== "warga-announcements") {
      return;
    }
    setPublicLoading(true);
    setPublicError("");
    fetch("/api/announcements")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setPublicAnnouncements(data.map(mapAnnouncement)))
      .catch((err) => setPublicError(err.message || "Gagal memuat pengumuman."))
      .finally(() => setPublicLoading(false));
  }, [route.name]);

  useEffect(() => {
    if (route.name !== "warga-announcement-detail" || !route.slug || isAdmin) {
      return;
    }
    setPublicLoading(true);
    setPublicError("");
    fetch(`/api/announcements/${route.slug}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setPublicAnnouncement(mapAnnouncement(data)))
      .catch((err) => setPublicError(err.message || "Pengumuman tidak ditemukan."))
      .finally(() => setPublicLoading(false));
  }, [route.name, route.slug, isAdmin]);

  useEffect(() => {
    if (!isAdmin || route.name !== "warga-announcement-detail") {
      return;
    }
    const found = cmsAnnouncements.find((item) => item.slug === route.slug);
    if (!found || found.content) {
      return;
    }
    fetchWithAuth(`/api/admin/announcements/${found.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => syncCmsAnnouncement(data))
      .catch((err) => setCmsError(err.message || "Gagal memuat detail pengumuman."));
  }, [route.name, route.slug, isAdmin, cmsAnnouncements]);

  const handleCreateSubmission = (event) => {
    event.preventDefault();
    setNewError("");
    setNewNotice("");

    const requirements = REQUIREMENTS_BY_TYPE[newType] || [];
    const payload = {
      note: newNote,
      checklist: requirements
    };

    fetchWithAuth("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType, payload })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setNewNotice("Pengajuan berhasil dibuat.");
        setNewNote("");
        setHash(`/submissions/${data.id}`);
      })
      .catch((err) => setNewError(err.message || "failed to create"));
  };

  const handleUploadFile = (event) => {
    event.preventDefault();
    setUploadError("");
    setUploadNotice("");

    if (!uploadFile) {
      setUploadError("Pilih file terlebih dahulu.");
      return;
    }

    if (!documentType.trim()) {
      setUploadError("Jenis dokumen wajib diisi.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("document_type", documentType);

    fetchWithAuth(`/api/submissions/${route.id}/files`, {
      method: "POST",
      body: formData
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setUploadNotice("Dokumen berhasil diunggah.");
        setUploadFile(null);
        setDocumentType("");
        setSubmissionDetail((prev) => ({
          ...prev,
          files: prev ? [...prev.files, data] : [data]
        }));
      })
      .catch((err) => setUploadError(err.message || "upload failed"));
  };

  const handleAction = (event) => {
    event.preventDefault();
    setActionError("");
    setActionNotice("");

    fetchWithAuth(`/api/submissions/${route.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: actionNote || null })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        setActionNotice("Aksi berhasil disimpan.");
        setActionNote("");
        return fetchWithAuth(`/api/admin/submissions/${route.id}`);
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setAdminDetail(data))
      .catch((err) => setActionError(err.message || "action failed"));
  };

  const handleCmsSelect = (item) => {
    setCmsNotice("");
    setCmsError("");
    if (!item?.id) {
      setCmsDraft({ ...emptyAnnouncementDraft });
      return;
    }
    fetchWithAuth(`/api/admin/announcements/${item.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => syncCmsAnnouncement(data))
      .catch((err) => setCmsError(err.message || "Gagal memuat detail pengumuman."));
  };

  const handleCmsEdit = (item) => {
    handleCmsSelect(item);
    setTimeout(() => {
      cmsEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleCmsImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!cmsDraft?.id) {
      setCmsError("Simpan pengumuman terlebih dahulu sebelum unggah gambar.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setCmsError("File harus berupa gambar.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setCmsError("Ukuran gambar maksimal 2 MB.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setCmsError("");
    fetchWithAuth(`/api/admin/announcements/${cmsDraft.id}/cover`, {
      method: "POST",
      body: formData
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => syncCmsAnnouncement(data))
      .catch((err) => setCmsError(err.message || "Gagal mengunggah gambar."));
  };

  const handleCmsImageRemove = () => {
    if (!cmsDraft?.id) {
      setCmsError("Pengumuman belum tersimpan.");
      return;
    }
    setCmsError("");
    fetchWithAuth(`/api/admin/announcements/${cmsDraft.id}/cover`, {
      method: "DELETE"
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => syncCmsAnnouncement(data))
      .catch((err) => setCmsError(err.message || "Gagal menghapus gambar."));
  };

  const handleCmsSave = (event) => {
    event.preventDefault();
    if (!cmsDraft?.title?.trim()) {
      setCmsNotice("Judul pengumuman wajib diisi.");
      return;
    }
    if (!cmsDraft?.id) {
      setCmsError("Simpan gagal. Buat pengumuman terlebih dahulu.");
      return;
    }
    setCmsNotice("");
    setCmsError("");
    fetchWithAuth(`/api/admin/announcements/${cmsDraft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: cmsDraft.title,
        excerpt: cmsDraft.excerpt,
        category: cmsDraft.category,
        content: cmsDraft.content,
        slug: cmsDraft.slug || undefined,
        status: cmsDraft.status,
        cover_focus: cmsDraft.coverFocus
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        syncCmsAnnouncement(data);
        setCmsNotice("Perubahan disimpan sebagai draft.");
      })
      .catch((err) => setCmsError(err.message || "Gagal menyimpan pengumuman."));
  };

  const updateCmsItemStatus = (item, status, notice) => {
    if (!item?.id) {
      return;
    }
    setCmsNotice("");
    setCmsError("");
    fetchWithAuth(`/api/admin/announcements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        syncCmsAnnouncement(data);
        setCmsNotice(notice);
      })
      .catch((err) => setCmsError(err.message || "Gagal memperbarui status."));
  };

  const handleCmsPublish = () => {
    if (!cmsDraft?.title?.trim()) {
      setCmsNotice("Judul pengumuman wajib diisi sebelum diterbitkan.");
      return;
    }
    updateCmsItemStatus(cmsDraft, "PUBLISHED", "Pengumuman diterbitkan.");
  };

  const handleCmsArchive = () => {
    updateCmsItemStatus(cmsDraft, "ARCHIVED", "Pengumuman diarsipkan.");
  };

  const handleCmsSetDraft = () => {
    updateCmsItemStatus(cmsDraft, "DRAFT", "Pengumuman dikembalikan ke draft.");
  };

  const handleCmsCreate = () => {
    setCmsNotice("");
    setCmsError("");
    fetchWithAuth("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: emptyAnnouncementDraft.title,
        excerpt: emptyAnnouncementDraft.excerpt,
        category: emptyAnnouncementDraft.category,
        content: emptyAnnouncementDraft.content,
        status: "DRAFT",
        cover_focus: emptyAnnouncementDraft.coverFocus
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        syncCmsAnnouncement(data);
        setCmsNotice("Draft baru dibuat.");
      })
      .catch((err) => setCmsError(err.message || "Gagal membuat pengumuman."));
  };
  const handlePreviewFile = async (file) => {
    try {
      setPreviewError("");
      const response = await fetchWithAuth(`/api/files/${file.id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewFile(file);
      setPreviewUrl(url);
    } catch (err) {
      setPreviewError(err.message || "preview failed");
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setPreviewFile(null);
  };

  const getStatusMeta = (status) => {
    const normalized = (status || "").toUpperCase();
    const map = {
      SUBMITTED: { label: "Diajukan", icon: Clock, tone: "info" },
      IN_REVIEW: { label: "Diproses", icon: Clock, tone: "info" },
      REVISION_REQUIRED: { label: "Perlu Perbaikan", icon: AlertCircle, tone: "warning" },
      APPROVED: { label: "Disetujui", icon: CheckCircle2, tone: "success" },
      REJECTED: { label: "Ditolak", icon: XCircle, tone: "danger" },
      DRAFT: { label: "Draft", icon: FileText, tone: "info" },
      PUBLISHED: { label: "Terbit", icon: CheckCircle2, tone: "success" },
      ARCHIVED: { label: "Arsip", icon: XCircle, tone: "danger" }
    };
    return map[normalized] || { label: status || "-", icon: Clock, tone: "info" };
  };

  const StatusBadge = ({ status }) => {
    const meta = getStatusMeta(status);
    const Icon = meta.icon;
    const toneClass = {
      success: "border-status-success/30 bg-status-success/10 text-status-success",
      warning: "border-status-warning/30 bg-status-warning/10 text-status-warning",
      info: "border-status-info/30 bg-status-info/10 text-status-info",
      danger: "border-status-danger/30 bg-status-danger/10 text-status-danger"
    }[meta.tone];
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {meta.label}
      </span>
    );
  };

  const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );

  const PageHeader = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-white/80 p-6 shadow-soft md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-900 md:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );

  const renderMarkdown = (source) => {
    const lines = source.split("\n");
    const blocks = [];
    let listBuffer = [];
    const flushList = () => {
      if (listBuffer.length > 0) {
        blocks.push(
          <ul key={`list-${blocks.length}`} className="space-y-2">
            {listBuffer.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
        listBuffer = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }
      if (trimmed.startsWith("- ")) {
        listBuffer.push(trimmed.slice(2));
        return;
      }
      flushList();
      if (trimmed.startsWith("### ")) {
        blocks.push(
          <h3 key={`h3-${blocks.length}`} className="text-lg font-semibold">
            {trimmed.replace("### ", "")}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        blocks.push(
          <h2 key={`h2-${blocks.length}`} className="text-xl font-semibold">
            {trimmed.replace("## ", "")}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith("# ")) {
        blocks.push(
          <h1 key={`h1-${blocks.length}`} className="text-2xl font-semibold">
            {trimmed.replace("# ", "")}
          </h1>
        );
        return;
      }
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm">
          {trimmed}
        </p>
      );
    });
    flushList();
    return blocks;
  };

  const PrimaryButton = ({ onClick, children, type = "button", icon: Icon }) => (
    <button
      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
      type={type}
      onClick={onClick}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );

  const GhostButton = ({ onClick, children, type = "button", icon: Icon }) => (
    <button
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400"
      type={type}
      onClick={onClick}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );

  const IconButton = ({ onClick, label, icon: Icon, tone = "default" }) => (
    <button
      className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${
        tone === "primary"
          ? "border-brand-500/40 bg-brand-500/10 text-brand-600 hover:border-brand-500"
          : "border-border bg-white text-brand-700 hover:border-brand-400"
      }`}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const SkeletonLine = ({ width = "w-full" }) => (
    <div className={`h-3 rounded-full bg-slate-200 ${width}`} />
  );

  const renderLogin = () => (
    <section className="glass-panel rounded-3xl border border-border p-8 shadow-soft">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-600">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          SiWarga
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-brand-900">
          Satu Sistem, Semua Urusan Warga
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Pengajuan surat, data warga, dan dokumen persyaratan dikelola lebih cepat serta transparan.
        </p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={authMode === "login" ? handleLogin : handleRegister}
      >
        <label className="text-sm font-medium text-slate-600">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          Kata Sandi
          <input
            className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {authMode === "register" ? (
          <>
            <label className="text-sm font-medium text-slate-600">
              Nama Lengkap
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Nomor WhatsApp
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              NIK
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={nik}
                onChange={(event) => setNik(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Nomor KK
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={kkNumber}
                onChange={(event) => setKkNumber(event.target.value)}
                required
              />
            </label>
          </>
        ) : null}
        <PrimaryButton type="submit">{authMode === "login" ? "Masuk" : "Daftar Akun"}</PrimaryButton>
      </form>
      <div className="mt-4 text-sm">
        <button
          className="text-slate-600 underline decoration-brand-300"
          type="button"
          onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
        >
          {authMode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
      {authNotice ? <p className="mt-3 text-sm text-green-700">{authNotice}</p> : null}
      {authError ? <p className="mt-2 text-sm text-red-600">{authError}</p> : null}
    </section>
  );

  const renderProfile = () => (
    <section className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Profil Warga</h2>
          <p className="text-xs text-slate-500">Data yang terverifikasi untuk layanan surat.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <div className="text-slate-500">Full Name</div>
          <div className="font-semibold">{me?.full_name || "-"}</div>
        </div>
        <div>
          <div className="text-slate-500">Phone / WhatsApp</div>
          <div className="font-semibold">{me?.phone_number || "-"}</div>
        </div>
        <div>
          <div className="text-slate-500">NIK</div>
          <div className="font-semibold">{me?.nik || "-"}</div>
        </div>
        <div>
          <div className="text-slate-500">Nomor KK</div>
          <div className="font-semibold">{me?.kk_number || "-"}</div>
        </div>
        <div>
          <div className="text-slate-500">Email</div>
          <div className="font-semibold">{me?.email || "-"}</div>
        </div>
      </div>
    </section>
  );

  const renderDashboard = () => (
    <section className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Pengajuan Saya</h2>
            <p className="text-xs text-slate-500">Pantau status surat dan tindak lanjut.</p>
          </div>
        </div>
        <PrimaryButton onClick={() => setHash("/submissions/new")} icon={Plus}>
          Ajukan Surat
        </PrimaryButton>
      </div>
      <div className="mt-4 space-y-3">
        {isLoadingSubmissions ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-white p-4">
              <SkeletonLine width="w-1/2" />
              <div className="mt-2 flex gap-2">
                <SkeletonLine width="w-24" />
                <SkeletonLine width="w-20" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <SkeletonLine width="w-1/3" />
              <div className="mt-2 flex gap-2">
                <SkeletonLine width="w-20" />
                <SkeletonLine width="w-24" />
              </div>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title="Belum ada pengajuan"
            description="Mulai ajukan surat untuk melihat statusnya di sini."
            action={<PrimaryButton onClick={() => setHash("/submissions/new")}>Ajukan Surat</PrimaryButton>}
          />
        ) : (
          submissions.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left text-sm transition hover:border-brand-400"
              type="button"
              onClick={() => setHash(`/submissions/${item.id}`)}
            >
              <div>
                <div className="font-semibold text-brand-900">{item.type}</div>
                <div className="text-xs text-slate-500">Nomor pengajuan #{item.id}</div>
              </div>
              <StatusBadge status={item.status} />
            </button>
          ))
        )}
      </div>
    </section>
  );
  const renderNewSubmission = () => (
    <section className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-600">
          <FileCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-600">Langkah 1</p>
          <h2 className="text-lg font-semibold text-brand-900">Ajukan Surat Baru</h2>
          <p className="text-sm text-slate-500">
            Pilih jenis surat. Sistem menampilkan dokumen wajib agar pengajuan lancar.
          </p>
        </div>
      </div>
      <form className="mt-4 flex flex-col gap-4" onSubmit={handleCreateSubmission}>
        <label className="text-sm font-medium text-slate-600">
          Jenis Surat
          <select
            className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
            value={newType}
            onChange={(event) => setNewType(event.target.value)}
          >
            {LETTER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-2xl border border-accent-300/40 bg-accent-300/10 p-4 text-sm text-slate-700">
          <p className="font-semibold text-brand-900">Dokumen Wajib (siapkan sebelum unggah)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            {(REQUIREMENTS_BY_TYPE[newType] || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Dokumen diunggah setelah pengajuan dibuat (di halaman detail).
          </p>
        </div>
        <label className="text-sm font-medium text-slate-600">
          Catatan tambahan
          <textarea
            className="mt-2 h-28 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
          />
        </label>
        <PrimaryButton type="submit">Ajukan Sekarang</PrimaryButton>
      </form>
      {newNotice ? <p className="mt-3 text-sm text-green-700">{newNotice}</p> : null}
      {newError ? <p className="mt-2 text-sm text-red-600">{newError}</p> : null}
    </section>
  );

  const renderSubmissionDetail = () => (
    <section className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">
            Pengajuan #{submissionDetail?.id || route.id}
          </h2>
          <p className="text-xs text-slate-500">Detail dokumen dan status pengajuan.</p>
        </div>
        {submissionDetail ? <StatusBadge status={submissionDetail.status} /> : null}
      </div>
      {submissionDetail ? (
        <div className="mt-4 space-y-4 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-slate-500">Jenis Surat</div>
              <div className="font-semibold text-brand-900">{submissionDetail.type}</div>
              <div className="mt-2 text-slate-500">Aksi Terakhir</div>
              <div className="font-semibold text-brand-900">
                {submissionDetail.last_action
                  ? `${submissionDetail.last_action.action} - ${submissionDetail.last_action.note || ""}`
                  : "Belum ada update"}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-slate-500">Data Form</div>
              <pre className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                {JSON.stringify(submissionDetail.payload, null, 2)}
              </pre>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            <div className="text-slate-500">Dokumen Wajib</div>
            <div className="mt-2 space-y-2 text-xs text-slate-600">
              {(REQUIREMENTS_BY_TYPE[submissionDetail.type] || []).map((item) => {
                const uploaded = submissionDetail.files.some(
                  (file) => normalizeDocType(file.document_type) === normalizeDocType(item)
                );
                return (
                  <div key={item} className="flex items-center justify-between gap-3">
                    <span>{item}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          uploaded
                            ? "rounded-full border border-status-success/30 bg-status-success/10 px-2 py-0.5 text-[10px] font-semibold text-status-success"
                            : "rounded-full border border-border bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                        }
                      >
                        {uploaded ? "Sudah diunggah" : "Belum ada"}
                      </span>
                      <button
                        className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-brand-700"
                        type="button"
                        onClick={() => {
                          setDocumentType(item);
                          setUploadError("");
                          setUploadNotice("");
                        }}
                      >
                        Gunakan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Lampiran Dokumen</div>
            <div className="mt-2 space-y-2">
              {submissionDetail.files.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada file terunggah.</p>
              ) : (
                submissionDetail.files.map((file) => (
                  <button
                    key={file.id}
                    className="flex items-center gap-2 text-left text-xs text-brand-600 underline decoration-brand-300"
                    type="button"
                    onClick={() => handlePreviewFile(file)}
                  >
                    <FileText className="h-4 w-4" />
                    {file.original_name} ({file.document_type})
                  </button>
                ))
              )}
            </div>
          </div>
          <form className="space-y-3" onSubmit={handleUploadFile}>
            <label className="text-sm font-medium text-slate-600">
              Jenis dokumen (pilih dari daftar di atas)
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Unggah file
              <input
                className="mt-2 block w-full text-sm"
                type="file"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
            </label>
            <GhostButton type="submit">Unggah Dokumen</GhostButton>
            {uploadNotice ? <p className="text-sm text-green-700">{uploadNotice}</p> : null}
            {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
          </form>
        </div>
      ) : isLoadingSubmissionDetail ? (
        <div className="mt-4 space-y-3">
          <SkeletonLine width="w-1/2" />
          <SkeletonLine width="w-1/3" />
          <div className="rounded-xl border border-border bg-white p-4">
            <SkeletonLine width="w-2/3" />
            <SkeletonLine width="w-full" />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Memuat detail pengajuan...</p>
      )}
    </section>
  );
  const renderAdminList = () => (
    <section className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Daftar Pengajuan</h2>
          <p className="text-xs text-slate-500">Pantau dan tindak lanjut pengajuan warga.</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {isLoadingAdminSubmissions ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-white p-4">
              <SkeletonLine width="w-1/2" />
              <SkeletonLine width="w-1/3" />
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <SkeletonLine width="w-2/3" />
              <SkeletonLine width="w-1/3" />
            </div>
          </div>
        ) : adminSubmissions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada pengajuan masuk"
            description="Data pengajuan akan tampil otomatis saat warga mengajukan surat."
          />
        ) : (
          adminSubmissions.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left text-sm transition hover:border-brand-400"
              type="button"
              onClick={() => setHash(`/admin/${item.id}`)}
            >
              <div>
                <div className="font-semibold text-brand-900">{item.type}</div>
                <div className="text-xs text-slate-500">
                  Warga: {item.owner_full_name || item.owner_email}
                </div>
              </div>
              <StatusBadge status={item.status} />
            </button>
          ))
        )}
      </div>
    </section>
  );

  const renderAdminDetail = () => (
    <section className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">
            Detail Pengajuan #{adminDetail?.id || route.id}
          </h2>
          <p className="text-xs text-slate-500">Ringkasan warga dan dokumen pendukung.</p>
        </div>
        {adminDetail ? <StatusBadge status={adminDetail.status} /> : null}
      </div>
      {adminDetail ? (
        <div className="mt-4 space-y-4 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-slate-500">Warga</div>
              <div className="font-semibold text-brand-900">
                {adminDetail.owner_full_name || adminDetail.owner_email}
              </div>
              <div className="text-xs text-slate-500">NIK: {adminDetail.owner_nik || "-"}</div>
              <div className="text-xs text-slate-500">KK: {adminDetail.owner_kk_number || "-"}</div>
              <div className="text-xs text-slate-500">
                Telepon: {adminDetail.owner_phone_number || "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-slate-500">Jenis Surat</div>
              <div className="font-semibold text-brand-900">{adminDetail.type}</div>
              <div className="mt-2 text-slate-500">Payload</div>
              <pre className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                {JSON.stringify(adminDetail.payload, null, 2)}
              </pre>
            </div>
          </div>
          <div>
            <div className="text-slate-500">Lampiran Warga</div>
            <div className="mt-2 space-y-2">
              {adminDetail.files.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada file.</p>
              ) : (
                adminDetail.files.map((file) => (
                  <button
                    key={file.id}
                    className="flex items-center gap-2 text-left text-xs text-brand-600 underline decoration-brand-300"
                    type="button"
                    onClick={() => handlePreviewFile(file)}
                  >
                    <FileText className="h-4 w-4" />
                    {file.original_name} ({file.document_type})
                  </button>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Riwayat Aksi</div>
            <div className="mt-2 space-y-2">
              {adminDetail.logs.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada catatan aksi.</p>
              ) : (
                adminDetail.logs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-border bg-white p-3 text-xs">
                    <div className="font-semibold text-brand-900">{log.action}</div>
                    <div className="text-slate-500">{log.note || "-"}</div>
                    <div className="text-slate-400">{log.created_at}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <form className="space-y-3" onSubmit={handleAction}>
            <label className="text-sm font-medium text-slate-600">
              Aksi
              <select
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={action}
                onChange={(event) => setAction(event.target.value)}
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Catatan
              <textarea
                className="mt-2 h-24 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={actionNote}
                onChange={(event) => setActionNote(event.target.value)}
              />
            </label>
            <PrimaryButton type="submit" icon={Send}>
              Simpan Aksi
            </PrimaryButton>
            {actionNotice ? <p className="text-sm text-green-700">{actionNotice}</p> : null}
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
          </form>
        </div>
      ) : isLoadingAdminDetail ? (
        <div className="mt-4 space-y-3">
          <SkeletonLine width="w-1/2" />
          <SkeletonLine width="w-1/3" />
          <div className="rounded-xl border border-border bg-white p-4">
            <SkeletonLine width="w-2/3" />
            <SkeletonLine width="w-full" />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Memuat detail pengajuan...</p>
      )}
    </section>
  );

  const renderWargaAnnouncements = () => (
    <section className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Pengumuman Terkini</h2>
          <p className="text-xs text-slate-500">
            Informasi resmi dari RW agar warga selalu update.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs text-slate-500">
          <Bell className="h-4 w-4 text-accent-600" />
          Update rutin tiap minggu
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {publicLoading ? (
          <div className="rounded-2xl border border-border bg-white p-6 text-sm text-slate-500">
            Memuat pengumuman...
          </div>
        ) : null}
        {publicError ? (
          <div className="rounded-2xl border border-border bg-white p-6 text-sm text-red-600">
            {publicError}
          </div>
        ) : null}
        {!publicLoading && publicAnnouncements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Belum ada pengumuman"
            description="Pengumuman resmi dari RW akan tampil di sini."
          />
        ) : null}
        {publicAnnouncements.map((item) => (
          <button
            key={item.id}
            className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-white text-left shadow-soft transition hover:border-brand-400"
            type="button"
            onClick={() => setHash(`/warga/pengumuman/${encodeURIComponent(item.slug)}`)}
          >
            <div
              className="relative flex h-32 items-center justify-center bg-gradient-to-br from-brand-600/15 via-accent-300/30 to-brand-500/10"
              style={
                item.coverUrl
                  ? {
                      backgroundImage: `url(${item.coverUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: item.coverFocus || "center"
                    }
                  : null
              }
            >
              <div className="absolute inset-0 bg-brand-900/10" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-brand-600 shadow-soft">
                <Megaphone className="h-6 w-6" />
              </div>
            </div>
            <div className="px-5 pt-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
              <span className="rounded-full border border-accent-300/40 bg-accent-300/20 px-2 py-0.5 text-[10px] font-semibold text-accent-600">
                {item.category}
              </span>
              <span>{item.publishedAt || item.updatedAt || ""}</span>
              </div>
            </div>
            <div className="px-5 text-base font-semibold text-brand-900">{item.title}</div>
            <p className="px-5 text-sm text-slate-500">{item.excerpt}</p>
            <div className="mt-auto px-5 pb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-600">
                Baca detail
                <span className="h-5 w-5 rounded-full border border-brand-500/40 bg-brand-500/10 text-center text-[10px]">
                  {"->"}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );

  const renderWargaAnnouncementDetail = () => (
    <section className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
      {publicLoading && !currentAnnouncement ? (
        <div className="rounded-2xl border border-border bg-white p-6 text-sm text-slate-500">
          Memuat pengumuman...
        </div>
      ) : null}
      {publicError && !currentAnnouncement ? (
        <div className="rounded-2xl border border-border bg-white p-6 text-sm text-red-600">
          {publicError}
        </div>
      ) : null}
      {currentAnnouncement ? (
        <div className="space-y-6">
          {currentAnnouncement.coverUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                className="h-56 w-full object-cover"
                src={currentAnnouncement.coverUrl}
                alt={currentAnnouncement.coverName || currentAnnouncement.title}
                style={{ objectPosition: currentAnnouncement.coverFocus || "center" }}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-accent-300/40 bg-accent-300/20 px-2 py-0.5 text-[10px] font-semibold text-accent-600">
                {currentAnnouncement.category}
              </span>
              <span>{currentAnnouncement.publishedAt || currentAnnouncement.updatedAt || ""}</span>
            </div>
            <h2 className="text-2xl font-semibold text-brand-900">{currentAnnouncement.title}</h2>
            <p className="text-sm text-slate-500">{currentAnnouncement.excerpt}</p>
          </div>
          <div className="prose-siwarga space-y-4 text-sm">
            {renderMarkdown(currentAnnouncement.content)}
          </div>
          <GhostButton onClick={() => setHash("/warga/pengumuman")}>Kembali ke Pengumuman</GhostButton>
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="Pengumuman tidak ditemukan"
          description="Cek daftar pengumuman terbaru untuk informasi resmi dari RW."
          action={<PrimaryButton onClick={() => setHash("/warga/pengumuman")}>Lihat Pengumuman</PrimaryButton>}
        />
      )}
    </section>
  );
  const renderAdminAnnouncements = () => (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">CMS Pengumuman</h2>
            <p className="text-xs text-slate-500">
              Kelola konten informasi untuk warga secara terstruktur.
            </p>
          </div>
          <PrimaryButton onClick={handleCmsCreate} icon={Plus}>
            Buat Pengumuman
          </PrimaryButton>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[
            { key: "ALL", label: `Semua (${cmsCounts.ALL})` },
            { key: "PUBLISHED", label: `Terbit (${cmsCounts.PUBLISHED})` },
            { key: "DRAFT", label: `Draft (${cmsCounts.DRAFT})` },
            { key: "ARCHIVED", label: `Arsip (${cmsCounts.ARCHIVED})` }
          ].map((item) => (
            <button
              key={item.key}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                cmsFilter === item.key
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-border bg-white text-brand-700 hover:border-brand-400"
              }`}
              type="button"
              onClick={() => setCmsFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {cmsLoading ? (
          <div className="mt-3 rounded-2xl border border-border bg-white p-4 text-sm text-slate-500">
            Memuat data CMS...
          </div>
        ) : null}
        {!cmsLoading && cmsError ? (
          <div className="mt-3 rounded-2xl border border-border bg-white p-4 text-sm text-red-600">
            {cmsError}
          </div>
        ) : null}
        <div className="mt-3 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCmsAnnouncements.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-xs text-slate-500" colSpan={5}>
                    Tidak ada pengumuman untuk filter ini.
                  </td>
                </tr>
              ) : null}
              {filteredCmsAnnouncements.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-brand-600" />
                      <button
                        className="font-semibold text-brand-900 hover:text-brand-600"
                        type="button"
                        onClick={() => handleCmsEdit(item)}
                      >
                        {item.title}
                      </button>
                    </div>
                    <div className="text-xs text-slate-400">{item.authorName || "Admin RW"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{item.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{item.updatedAt || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <IconButton
                        icon={Eye}
                        label="Preview"
                        onClick={() => setHash(`/warga/pengumuman/${encodeURIComponent(item.slug)}`)}
                      />
                      <IconButton icon={Pencil} label="Edit" onClick={() => handleCmsEdit(item)} />
                      {item.status !== "PUBLISHED" ? (
                        <IconButton
                          icon={Send}
                          label="Terbitkan"
                          tone="primary"
                          onClick={() => updateCmsItemStatus(item, "PUBLISHED", "Pengumuman diterbitkan.")}
                        />
                      ) : null}
                      {item.status !== "ARCHIVED" ? (
                        <IconButton
                          icon={XCircle}
                          label="Arsipkan"
                          onClick={() => updateCmsItemStatus(item, "ARCHIVED", "Pengumuman diarsipkan.")}
                        />
                      ) : (
                        <IconButton
                          icon={FileText}
                          label="Kembali Draft"
                          onClick={() =>
                            updateCmsItemStatus(item, "DRAFT", "Pengumuman dikembalikan ke draft.")
                          }
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          ref={cmsEditorRef}
          className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft"
          onSubmit={handleCmsSave}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-900">Editor Pengumuman</h3>
              <p className="text-xs text-slate-500">Gunakan bahasa yang ramah dan jelas.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <label className="text-sm font-medium text-slate-600">
              Judul
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={cmsDraft?.title || ""}
                onChange={(event) => setCmsDraft((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Ringkasan
              <textarea
                className="mt-2 h-20 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={cmsDraft?.excerpt || ""}
                onChange={(event) => setCmsDraft((prev) => ({ ...prev, excerpt: event.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Kategori
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={cmsDraft?.category || ""}
                onChange={(event) => setCmsDraft((prev) => ({ ...prev, category: event.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Foto / Cover
              <div className="mt-2 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-slate-50/60 p-3">
                {cmsDraft?.coverUrl ? (
                  <div className="overflow-hidden rounded-xl border border-border bg-white">
                    <img
                      className="h-36 w-full object-cover"
                      src={cmsDraft.coverUrl}
                      alt={cmsDraft.coverName || "cover"}
                      style={{ objectPosition: cmsDraft.coverFocus || "center" }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="h-4 w-4 text-brand-600" />
                    Belum ada gambar. Unggah untuk tampil di kartu pengumuman.
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="text-xs"
                    type="file"
                    accept="image/*"
                    onChange={handleCmsImageUpload}
                  />
                  <span className="text-[11px] text-slate-500">Maks 2 MB, JPG/PNG/WebP.</span>
                  {cmsDraft?.coverUrl ? (
                    <GhostButton type="button" onClick={handleCmsImageRemove}>
                      Hapus Gambar
                    </GhostButton>
                  ) : null}
                </div>
              </div>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Fokus Gambar
              <select
                className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={cmsDraft?.coverFocus || "center"}
                onChange={(event) =>
                  setCmsDraft((prev) => ({ ...prev, coverFocus: event.target.value }))
                }
              >
                <option value="top">Atas</option>
                <option value="center">Tengah</option>
                <option value="bottom">Bawah</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Konten (Markdown)
              <textarea
                className="mt-2 h-44 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={cmsDraft?.content || ""}
                onChange={(event) => setCmsDraft((prev) => ({ ...prev, content: event.target.value }))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="submit" icon={FileCheck}>
                Simpan Draft
              </PrimaryButton>
              <GhostButton type="button" onClick={handleCmsPublish} icon={Send}>
                Terbitkan
              </GhostButton>
              {cmsDraft?.status === "ARCHIVED" ? (
                <GhostButton type="button" onClick={handleCmsSetDraft}>
                  Kembalikan ke Draft
                </GhostButton>
              ) : (
                <GhostButton type="button" onClick={handleCmsArchive}>
                  Arsipkan
                </GhostButton>
              )}
            </div>
            {cmsNotice ? <p className="text-sm text-green-700">{cmsNotice}</p> : null}
            {cmsError ? <p className="text-sm text-red-600">{cmsError}</p> : null}
          </div>
        </form>
        <div className="rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-900">Preview Warga</h3>
              <p className="text-xs text-slate-500">Tampilan hasil sebelum diterbitkan.</p>
            </div>
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <div className="space-y-1">
              <div className="text-xs text-slate-500">
                {cmsDraft?.category || "Kategori"} - {cmsDraft?.publishedAt || cmsDraft?.updatedAt || "Hari ini"}
              </div>
              <h4 className="text-lg font-semibold text-brand-900">{cmsDraft?.title || "Judul"}</h4>
              <p className="text-sm text-slate-500">{cmsDraft?.excerpt || "Ringkasan pengumuman."}</p>
            </div>
            {cmsDraft?.coverUrl ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <img
                  className="h-40 w-full object-cover"
                  src={cmsDraft.coverUrl}
                  alt={cmsDraft.coverName || "cover"}
                  style={{ objectPosition: cmsDraft.coverFocus || "center" }}
                />
              </div>
            ) : null}
            <div className="prose-siwarga space-y-3 text-sm">
              {renderMarkdown(cmsDraft?.content || "")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderPage = () => {
    if (!token) {
      return renderLogin();
    }

    if (route.name === "warga-announcements") {
      return renderWargaAnnouncements();
    }

    if (route.name === "warga-announcement-detail") {
      return renderWargaAnnouncementDetail();
    }

    if (route.name === "submission-new") {
      return renderNewSubmission();
    }

    if (route.name === "submission-detail") {
      return renderSubmissionDetail();
    }

    if (route.name === "admin-list" && isAdmin) {
      return renderAdminList();
    }

    if (route.name === "admin-detail" && isAdmin) {
      return renderAdminDetail();
    }

    if (route.name === "admin-announcements" && isAdmin) {
      return renderAdminAnnouncements();
    }

    if (isAdmin) {
      return renderAdminList();
    }

    return (
      <div className="space-y-6">
        {renderProfile()}
        {renderDashboard()}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-border bg-white/80 p-6 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-600">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              SiWarga
            </div>
            <h1 className="mt-3 text-3xl font-bold text-brand-900">
              {token ? (isAdmin ? "Panel Admin SiWarga" : "Dashboard Warga") : "Masuk ke SiWarga"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Satu Sistem, Semua Urusan Warga.</p>
          </div>
          {token ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-brand-700">
                {me?.email || "loading"} - {me?.role || "-"}
              </span>
              <GhostButton onClick={handleLogout} icon={LogOut}>
                Keluar
              </GhostButton>
            </div>
          ) : null}
        </header>

        {token ? (
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            {isAdmin ? (
              <aside className="glass-panel h-fit rounded-3xl border border-border p-4 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Navigasi Admin
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <button
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold transition ${
                      route.name === "admin-list" || route.name === "admin-detail"
                        ? "bg-brand-600 text-white shadow-glow"
                        : "text-brand-700 hover:bg-brand-500/10"
                    }`}
                    type="button"
                    onClick={() => setHash("/admin")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold transition ${
                      route.name === "admin-announcements"
                        ? "bg-brand-600 text-white shadow-glow"
                        : "text-brand-700 hover:bg-brand-500/10"
                    }`}
                    type="button"
                    onClick={() => setHash("/admin/pengumuman")}
                  >
                    <Megaphone className="h-4 w-4" />
                    Pengumuman
                  </button>
                </div>
              </aside>
            ) : (
              <aside className="glass-panel h-fit rounded-3xl border border-border p-4 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Navigasi Warga
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <button
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold transition ${
                      route.name === "dashboard" || route.name === "submission-detail"
                        ? "bg-brand-600 text-white shadow-glow"
                        : "text-brand-700 hover:bg-brand-500/10"
                    }`}
                    type="button"
                    onClick={() => setHash("/")}
                  >
                    <Home className="h-4 w-4" />
                    Beranda
                  </button>
                  <button
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold transition ${
                      route.name === "submission-new"
                        ? "bg-brand-600 text-white shadow-glow"
                        : "text-brand-700 hover:bg-brand-500/10"
                    }`}
                    type="button"
                    onClick={() => setHash("/submissions/new")}
                  >
                    <FileCheck className="h-4 w-4" />
                    Ajukan Surat
                  </button>
                  <button
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold transition ${
                      route.name === "warga-announcements" || route.name === "warga-announcement-detail"
                        ? "bg-brand-600 text-white shadow-glow"
                        : "text-brand-700 hover:bg-brand-500/10"
                    }`}
                    type="button"
                    onClick={() => setHash("/warga/pengumuman")}
                  >
                    <Megaphone className="h-4 w-4" />
                    Pengumuman
                  </button>
                </div>
              </aside>
            )}
            <div className="space-y-6">
              {isAdmin ? (
                <PageHeader
                  icon={ShieldCheck}
                  title={route.name === "admin-announcements" ? "CMS Pengumuman" : "Dashboard Admin"}
                  description="Pantau layanan warga dan kelola konten resmi."
                />
              ) : (
                <PageHeader
                  icon={route.name === "warga-announcements" ? Megaphone : FileText}
                  title={
                    route.name === "warga-announcements"
                      ? "Pengumuman Warga"
                      : route.name === "submission-new"
                      ? "Ajukan Surat"
                      : "Dashboard Warga"
                  }
                  description="Semua kebutuhan administrasi warga tersedia di sini."
                  action={
                    route.name === "dashboard" ? (
                      <PrimaryButton onClick={() => setHash("/submissions/new")} icon={Plus}>
                        Ajukan Surat
                      </PrimaryButton>
                    ) : null
                  }
                />
              )}

              {renderPage()}
            </div>
          </div>
        ) : (
          renderPage()
        )}

        {previewFile ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div className="relative w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-sm font-semibold text-brand-900">
                  {previewFile.original_name}
                </div>
                <GhostButton onClick={closePreview}>Tutup</GhostButton>
              </div>
              <div className="mt-4 h-[70vh] overflow-auto rounded-xl border border-border bg-slate-50">
                {previewFile.mime_type?.startsWith("image/") ? (
                  <img className="mx-auto max-h-full" src={previewUrl} alt={previewFile.original_name} />
                ) : previewFile.mime_type === "application/pdf" ? (
                  <iframe className="h-full w-full" src={previewUrl} title={previewFile.original_name} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-slate-600">
                    <p>Preview belum tersedia untuk tipe file ini.</p>
                    <a
                      className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-brand-700"
                      href={previewUrl}
                      download={previewFile.original_name || "download"}
                    >
                      Unduh Dokumen
                    </a>
                  </div>
                )}
              </div>
              {previewError ? <p className="mt-3 text-sm text-red-600">{previewError}</p> : null}
            </div>
          </div>
        ) : null}

        {!token ? null : (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/90 px-6 py-3 shadow-soft md:hidden">
            {!isAdmin ? (
              <div className="flex items-center justify-around text-xs text-slate-500">
                <button
                  className={`flex flex-col items-center gap-1 ${
                    route.name === "dashboard" ? "text-brand-600" : ""
                  }`}
                  type="button"
                  onClick={() => setHash("/")}
                >
                  <Home className="h-5 w-5" />
                  Beranda
                </button>
                <button
                  className={`flex flex-col items-center gap-1 ${
                    route.name === "submission-new" ? "text-brand-600" : ""
                  }`}
                  type="button"
                  onClick={() => setHash("/submissions/new")}
                >
                  <FileCheck className="h-5 w-5" />
                  Ajukan
                </button>
                <button
                  className={`flex flex-col items-center gap-1 ${
                    route.name === "warga-announcements" ? "text-brand-600" : ""
                  }`}
                  type="button"
                  onClick={() => setHash("/warga/pengumuman")}
                >
                  <Megaphone className="h-5 w-5" />
                  Info
                </button>
              </div>
            ) : null}
          </div>
        )}

        <section className="rounded-2xl border border-border bg-white/80 p-4 text-sm text-slate-600 shadow-soft">
          <p>Health: {health}</p>
          {healthError ? <p className="text-red-600">{healthError}</p> : null}
        </section>
        <p className="text-xs text-slate-400">API base path: /api</p>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
