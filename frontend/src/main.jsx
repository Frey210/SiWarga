import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
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

const ACTION_OPTIONS = ["SET_IN_REVIEW", "APPROVE", "REJECT", "REQUEST_REVISION"];

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

  const isAdmin = useMemo(() => me?.role === "ADMIN_RW", [me]);

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
        setAuthNotice("Registered. Please login.");
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
        fetchWithAuth("/api/admin/submissions")
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
          })
          .then((data) => setAdminSubmissions(data))
          .catch((err) => setAuthError(err.message || "failed to load admin list"));
      } else {
        fetchWithAuth("/api/submissions")
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
          })
          .then((data) => setSubmissions(data))
          .catch((err) => setAuthError(err.message || "failed to load submissions"));
      }
    }

    if (route.name === "admin-list" && isAdmin) {
      fetchWithAuth("/api/admin/submissions")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setAdminSubmissions(data))
        .catch((err) => setAuthError(err.message || "failed to load admin list"));
    }

    if (route.name === "submission-detail") {
      fetchWithAuth(`/api/submissions/${route.id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setSubmissionDetail(data))
        .catch((err) => setAuthError(err.message || "failed to load submission"));
    }

    if (route.name === "admin-detail" && isAdmin) {
      fetchWithAuth(`/api/admin/submissions/${route.id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setAdminDetail(data))
        .catch((err) => setAuthError(err.message || "failed to load admin detail"));
    }
  }, [route, token, me, isAdmin]);

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
        setNewNotice("Submission created");
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
      setUploadError("Select a file first");
      return;
    }

    if (!documentType.trim()) {
      setUploadError("Document type is required");
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
        setUploadNotice("Uploaded");
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
        setActionNotice("Action saved");
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

  const renderLogin = () => (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-orange-100">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">SiWarga</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Satu Sistem, Semua Urusan Warga.
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Pengajuan surat, data warga, dan dokumen persyaratan dikelola lebih cepat dan transparan.
        </p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={authMode === "login" ? handleLogin : handleRegister}
      >
        <label className="text-sm font-medium text-slate-600">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          Password
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {authMode === "register" ? (
          <>
            <label className="text-sm font-medium text-slate-600">
              Full Name
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Phone / WhatsApp
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              NIK
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={nik}
                onChange={(event) => setNik(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Nomor KK
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={kkNumber}
                onChange={(event) => setKkNumber(event.target.value)}
                required
              />
            </label>
          </>
        ) : null}
        <button
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          {authMode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <div className="mt-4 text-sm">
        <button
          className="text-slate-600 underline decoration-orange-300"
          type="button"
          onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
        >
          {authMode === "login" ? "Need an account? Register" : "Have an account? Login"}
        </button>
      </div>
      {authNotice ? <p className="mt-3 text-sm text-green-700">{authNotice}</p> : null}
      {authError ? <p className="mt-2 text-sm text-red-600">{authError}</p> : null}
    </section>
  );

  const renderProfile = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Profile Data Warga</h2>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Submissions</h2>
        <button
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          type="button"
          onClick={() => setHash("/submissions/new")}
        >
          New
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {submissions.length === 0 ? <p className="text-sm text-slate-500">No submissions.</p> : null}
        {submissions.map((item) => (
          <button
            key={item.id}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm"
            type="button"
            onClick={() => setHash(`/submissions/${item.id}`)}
          >
            <div className="font-semibold">{item.type}</div>
            <div className="text-xs text-slate-500">Status: {item.status}</div>
          </button>
        ))}
      </div>
    </section>
  );

  const renderNewSubmission = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">Step 1</p>
        <h2 className="text-lg font-semibold">Buat Pengajuan Baru</h2>
        <p className="text-sm text-slate-500">
          Pilih jenis surat. Sistem akan menampilkan dokumen wajib agar tidak salah upload.
        </p>
      </div>
      <form className="mt-4 flex flex-col gap-4" onSubmit={handleCreateSubmission}>
        <label className="text-sm font-medium text-slate-600">
          Jenis Surat
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
        <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-800">Dokumen Wajib (Siapkan sebelum upload)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            {(REQUIREMENTS_BY_TYPE[newType] || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Dokumen diunggah setelah submission dibuat (di halaman detail).
          </p>
        </div>
        <label className="text-sm font-medium text-slate-600">
          Form tambahan (catatan)
          <textarea
            className="mt-2 h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
          />
        </label>
        <button
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          Submit
        </button>
      </form>
      {newNotice ? <p className="mt-3 text-sm text-green-700">{newNotice}</p> : null}
      {newError ? <p className="mt-2 text-sm text-red-600">{newError}</p> : null}
    </section>
  );

  const renderSubmissionDetail = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Submission #{submissionDetail?.id || route.id}</h2>
      {submissionDetail ? (
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <div className="text-slate-500">Type</div>
            <div className="font-semibold">{submissionDetail.type}</div>
          </div>
          <div>
            <div className="text-slate-500">Status</div>
            <div className="font-semibold">{submissionDetail.status}</div>
          </div>
          <div>
            <div className="text-slate-500">Last Action</div>
            <div className="font-semibold">
              {submissionDetail.last_action
                ? `${submissionDetail.last_action.action} - ${submissionDetail.last_action.note || ""}`
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Payload</div>
            <pre className="mt-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
              {JSON.stringify(submissionDetail.payload, null, 2)}
            </pre>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                            : "rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                        }
                      >
                        {uploaded ? "Uploaded" : "Missing"}
                      </span>
                      <button
                        className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700"
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
            <div className="text-slate-500">Files</div>
            <div className="mt-2 space-y-2">
              {submissionDetail.files.length === 0 ? (
                <p className="text-xs text-slate-500">No files yet.</p>
              ) : (
                submissionDetail.files.map((file) => (
                  <button
                    key={file.id}
                    className="block text-left text-xs text-blue-600 underline"
                    type="button"
                    onClick={() => handlePreviewFile(file)}
                  >
                    {file.original_name} ({file.document_type})
                  </button>
                ))
              )}
            </div>
          </div>
          <form className="space-y-3" onSubmit={handleUploadFile}>
            <label className="text-sm font-medium text-slate-600">
              Document type (pilih dari daftar di atas)
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Upload file
              <input
                className="mt-2 block w-full text-sm"
                type="file"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
            </label>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              type="submit"
            >
              Upload
            </button>
            {uploadNotice ? <p className="text-sm text-green-700">{uploadNotice}</p> : null}
            {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
          </form>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}
    </section>
  );

  const renderAdminList = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">All Submissions</h2>
      <div className="mt-4 space-y-3">
        {adminSubmissions.length === 0 ? <p className="text-sm text-slate-500">No submissions.</p> : null}
        {adminSubmissions.map((item) => (
          <button
            key={item.id}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm"
            type="button"
            onClick={() => setHash(`/admin/${item.id}`)}
          >
            <div className="font-semibold">{item.type}</div>
            <div className="text-xs text-slate-500">Owner: {item.owner_full_name || item.owner_email}</div>
            <div className="text-xs text-slate-500">Status: {item.status}</div>
          </button>
        ))}
      </div>
    </section>
  );

  const renderAdminDetail = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Admin Detail #{adminDetail?.id || route.id}</h2>
      {adminDetail ? (
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <div className="text-slate-500">Owner</div>
            <div className="font-semibold">{adminDetail.owner_full_name || adminDetail.owner_email}</div>
            <div className="text-xs text-slate-500">NIK: {adminDetail.owner_nik || "-"}</div>
            <div className="text-xs text-slate-500">KK: {adminDetail.owner_kk_number || "-"}</div>
            <div className="text-xs text-slate-500">Phone: {adminDetail.owner_phone_number || "-"}</div>
          </div>
          <div>
            <div className="text-slate-500">Type</div>
            <div className="font-semibold">{adminDetail.type}</div>
          </div>
          <div>
            <div className="text-slate-500">Status</div>
            <div className="font-semibold">{adminDetail.status}</div>
          </div>
          <div>
            <div className="text-slate-500">Payload</div>
            <pre className="mt-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
              {JSON.stringify(adminDetail.payload, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-slate-500">Files</div>
            <div className="mt-2 space-y-2">
              {adminDetail.files.length === 0 ? (
                <p className="text-xs text-slate-500">No files yet.</p>
              ) : (
                adminDetail.files.map((file) => (
                  <button
                    key={file.id}
                    className="block text-left text-xs text-blue-600 underline"
                    type="button"
                    onClick={() => handlePreviewFile(file)}
                  >
                    {file.original_name} ({file.document_type})
                  </button>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Approval Logs</div>
            <div className="mt-2 space-y-2">
              {adminDetail.logs.length === 0 ? (
                <p className="text-xs text-slate-500">No logs yet.</p>
              ) : (
                adminDetail.logs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                    <div className="font-semibold">{log.action}</div>
                    <div className="text-slate-500">{log.note || "-"}</div>
                    <div className="text-slate-400">{log.created_at}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <form className="space-y-3" onSubmit={handleAction}>
            <label className="text-sm font-medium text-slate-600">
              Action
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={action}
                onChange={(event) => setAction(event.target.value)}
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Note
              <textarea
                className="mt-2 h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={actionNote}
                onChange={(event) => setActionNote(event.target.value)}
              />
            </label>
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Save Action
            </button>
            {actionNotice ? <p className="text-sm text-green-700">{actionNotice}</p> : null}
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
          </form>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}
    </section>
  );

  const renderPage = () => {
    if (!token) {
      return renderLogin();
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-orange-500">SiWarga</p>
            <h1 className="mt-2 text-3xl font-bold">
              {token ? "Dashboard Warga" : "Login"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Satu Sistem, Semua Urusan Warga.</p>
          </div>
          {token ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                {me?.email || "loading"} ({me?.role || "-"})
              </span>
              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : null}
        </header>

        {token ? (
          <nav className="flex flex-wrap gap-3">
            {!isAdmin ? (
              <>
                <button
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  type="button"
                  onClick={() => setHash("/")}
                >
                  Warga Dashboard
                </button>
                <button
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  type="button"
                  onClick={() => setHash("/submissions/new")}
                >
                  New Submission
                </button>
              </>
            ) : null}
            {isAdmin ? (
              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                type="button"
                onClick={() => setHash("/admin")}
              >
                Admin Dashboard
              </button>
            ) : null}
          </nav>
        ) : null}

        {renderPage()}

        {previewFile ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div className="relative w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="text-sm font-semibold text-slate-700">
                  {previewFile.original_name}
                </div>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                  type="button"
                  onClick={closePreview}
                >
                  Close
                </button>
              </div>
              <div className="mt-4 h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50">
                {previewFile.mime_type?.startsWith("image/") ? (
                  <img className="mx-auto max-h-full" src={previewUrl} alt={previewFile.original_name} />
                ) : previewFile.mime_type === "application/pdf" ? (
                  <iframe className="h-full w-full" src={previewUrl} title={previewFile.original_name} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-sm text-slate-600">
                    <p>Preview not available for this file type.</p>
                    <a
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                      href={previewUrl}
                      download={previewFile.original_name || "download"}
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
              {previewError ? <p className="mt-3 text-sm text-red-600">{previewError}</p> : null}
            </div>
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p>Health: {health}</p>
          {healthError ? <p className="text-red-600">{healthError}</p> : null}
        </section>
        <p className="text-xs text-slate-400">API base path: /api</p>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
