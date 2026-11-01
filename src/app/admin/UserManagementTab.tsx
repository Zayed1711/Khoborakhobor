"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAdminUsersAction,
  getAdminUserDetailAction,
  updateUserStatusAction,
  updateUserRoleAction,
  updateUserDetailsAction,
  adminCreateUserAction,
  adminDeleteUserAction,
  getAdminUserStatsAction,
} from "@/actions/admin-users";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  Flame,
  BookOpen,
  Award,
  Bookmark,
  X,
  Lock,
  UserCheck,
  Check,
  Loader2,
} from "lucide-react";

export default function UserManagementTab({
  showNotify,
}: {
  showNotify: (type: "success" | "error" | "info", msg: string) => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [track, setTrack] = useState("all");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");

  // Local inline notice for instant feedback in the tab
  const [localNotice, setLocalNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Stats
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    suspended: number;
    byTrack: { bcs: number; admission: number; research: number; general: number };
  } | null>(null);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    institution: "",
    targetTrack: "BCS_GOVT",
    role: "student",
    status: "active",
    bio: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Loading row ID for status or role updates
  const [updatingRowId, setUpdatingRowId] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerNotice = (type: "success" | "error", message: string) => {
    setLocalNotice({ type, message });
    showNotify(type, message);
    setTimeout(() => {
      setLocalNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Load stats
  const loadStats = async () => {
    try {
      const res = await getAdminUserStatsAction();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch {}
  };

  // Load users list
  const loadUsers = async (page = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const res = await getAdminUsersAction({
        search: searchQuery,
        track,
        status,
        role,
        page,
        limit: 15,
      });

      if (res.success) {
        setUsers(res.users);
        setTotalUsers(res.totalUsers);
        setTotalPages(res.totalPages || 1);
        setCurrentPage(res.currentPage || 1);
      } else {
        triggerNotice("error", res.error || "ব্যবহারকারীদের তালিকা লোড করা যায়নি।");
      }
    } catch (err: any) {
      triggerNotice("error", err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadUsers(1);
  }, [track, status, role]);

  // Debounced auto-search as user types
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadUsers(1, val);
    }, 350);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    loadUsers(1, search);
  };

  const handleClearSearch = () => {
    setSearch("");
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    loadUsers(1, "");
  };

  // Toggle user status (Active <-> Suspended)
  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const isTargetAdmin = user.role === "admin";

    let confirmMsg =
      nextStatus === "suspended"
        ? `আপনি কি নিশ্চিতভাবে "${user.name}"-এর অ্যাকাউন্টটি স্থগিত (Suspend) করতে চান?`
        : `"${user.name}"-এর অ্যাকাউন্টটি পুনরায় সক্রিয় (Activate) করতে চান?`;

    if (isTargetAdmin) {
      confirmMsg = `[সতর্কতা: অ্যাডমিন অ্যাকাউন্ট] ` + confirmMsg;
    }

    if (!confirm(confirmMsg)) return;

    setUpdatingRowId(user.id);
    try {
      const res = await updateUserStatusAction(user.id, nextStatus);
      if (res.success) {
        triggerNotice("success", res.message || "স্ট্যাটাস পরিবর্তিত হয়েছে।");
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
        );
        loadStats();
      } else {
        triggerNotice("error", res.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      triggerNotice("error", err.message);
    } finally {
      setUpdatingRowId(null);
    }
  };

  // Toggle user role
  const handleChangeRole = async (user: any, newRole: "student" | "admin" | "moderator") => {
    if (user.role === newRole) return;

    if (user.role === "admin" && newRole !== "admin") {
      if (!confirm(`সতর্কতা: আপনি কি নিশ্চিতভাবে "${user.name}"-এর অ্যাডমিন অধিকার প্রত্যাহার করতে চান?`)) {
        return;
      }
    }

    setUpdatingRowId(user.id);
    try {
      const res = await updateUserRoleAction(user.id, newRole);
      if (res.success) {
        triggerNotice("success", res.message || "রোল পরিবর্তিত হয়েছে।");
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      } else {
        triggerNotice("error", res.error);
      }
    } catch (err: any) {
      triggerNotice("error", err.message);
    } finally {
      setUpdatingRowId(null);
    }
  };

  // View user details modal
  const handleViewDetails = async (userId: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await getAdminUserDetailAction(userId);
      if (res.success && res.user) {
        setSelectedUser(res.user);
      } else {
        triggerNotice("error", res.error || "ব্যবহারকারীর তথ্য পাওয়া যায়নি।");
        setShowDetailModal(false);
      }
    } catch (err: any) {
      triggerNotice("error", err.message);
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: any) => {
    setEditError("");
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      institution: user.institution || "",
      targetTrack: user.targetTrack || "BCS_GOVT",
      role: user.role || "student",
      status: user.status || "active",
      bio: user.bio || "",
      streakDays: user.streakDays || 1,
      newPassword: "",
    });
    setShowEditModal(true);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSavingEdit(true);
    setEditError("");

    try {
      const res = await updateUserDetailsAction(editingUser.id, {
        name: editingUser.name,
        phone: editingUser.phone,
        institution: editingUser.institution,
        targetTrack: editingUser.targetTrack,
        role: editingUser.role,
        status: editingUser.status,
        bio: editingUser.bio,
        streakDays: Number(editingUser.streakDays) || 0,
        newPassword: editingUser.newPassword || undefined,
      });

      if (res.success) {
        triggerNotice("success", res.message || "তথ্য সফলভাবে হালনাগাদ হয়েছে।");
        setShowEditModal(false);
        loadUsers(currentPage);
        loadStats();
      } else {
        setEditError(res.error || "তথ্য হালনাগাদ করা যায়নি।");
      }
    } catch (err: any) {
      setEditError(err.message || "সার্ভারে ত্রুটি দেখা দিয়েছে।");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (user: any) => {
    let confirmMsg = `সতর্কতা: আপনি কি নিশ্চিতভাবে "${user.name}" (${user.email})-এর অ্যাকাউন্ট ও সমস্ত স্টাডি রেকর্ড চিরতরে মুছে ফেলতে চান?`;
    if (user.role === "admin") {
      confirmMsg = `[গুরুত্বপূর্ণ সতর্কতা: অ্যাডমিন অ্যাকাউন্ট]\nআপনি একজন অ্যাডমিন অ্যাকাউন্ট (${user.name}) মুছতে যাচ্ছেন। এটি নিশ্চিত কি?`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      const res = await adminDeleteUserAction(user.id);
      if (res.success) {
        triggerNotice("success", res.message || "অ্যাকাউন্ট অপসারিত হয়েছে।");
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        await loadStats();
        await loadUsers(currentPage);
      } else {
        triggerNotice("error", res.error);
      }
    } catch (err: any) {
      triggerNotice("error", err.message);
    }
  };

  // Create User Submit
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(createForm.email.trim())) {
      setCreateError("ব্যবহারকারী ইমেইল অবশ্যই একটি বৈধ @gmail.com ঠিকানা হতে হবে।");
      return;
    }

    if (createForm.password.length < 6) {
      setCreateError("পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।");
      return;
    }

    setCreating(true);
    try {
      const res = await adminCreateUserAction({
        ...createForm,
        email: createForm.email.trim().toLowerCase(),
      });
      if (res.success) {
        triggerNotice("success", res.message || "নতুন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।");
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          email: "",
          password: "",
          phone: "",
          institution: "",
          targetTrack: "BCS_GOVT",
          role: "student",
          status: "active",
          bio: "",
        });
        loadUsers(1);
        loadStats();
      } else {
        setCreateError(res.error || "অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setCreateError(err.message || "সার্ভারে ত্রুটি দেখা দিয়েছে।");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Local Feedback Notice Banner */}
      {localNotice && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all shadow-sm ${
            localNotice.type === "success"
              ? "bg-[#064e3b]/80 border-[#059669] text-[#a7f3d0]"
              : "bg-[#7f1d1d]/80 border-[#dc2626] text-[#fecaca]"
          }`}
        >
          <div className="flex items-center gap-2">
            {localNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34d399]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#f87171]" />
            )}
            <span>{localNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocalNotice(null)}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header Overview & Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
            <span>মোট নিবন্ধিত শিক্ষার্থী</span>
            <Users className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {stats?.total ?? totalUsers}
            </span>
            <span className="text-[11px] text-[#94a3b8]">অ্যাকাউন্ট</span>
          </div>
        </div>

        <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
            <span>সক্রিয় অ্যাকাউন্ট (Active)</span>
            <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {stats?.active ?? "-"}
            </span>
            <span className="text-[11px] text-[#4ade80]">অনুমোদিত</span>
          </div>
        </div>

        <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
            <span>স্থগিত অ্যাকাউন্ট (Suspended)</span>
            <AlertTriangle className="w-4 h-4 text-[#f87171]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {stats?.suspended ?? 0}
            </span>
            <span className="text-[11px] text-[#f87171]">স্থগিতকৃত</span>
          </div>
        </div>

        <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
            <span>বিসিএস ও সরকারি চাকরি ট্র্যাক</span>
            <GraduationCap className="w-4 h-4 text-[#f5c66b]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {stats?.byTrack?.bcs ?? "-"}
            </span>
            <span className="text-[11px] text-[#f5c66b]">পরীক্ষার্থী</span>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar (Search, Filter, Create) */}
      <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] max-w-md relative flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম, @gmail.com ইমেইল, ফোন বা প্রতিষ্ঠান খুঁজুন..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full text-xs pl-9 pr-16 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b] transition"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white p-1"
                title="খোঁজ বাতিল করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#1e293b] hover:bg-[#2a384e] text-[10px] font-semibold text-[#cbd5e1] rounded border border-[#334155] transition"
            >
              খুঁজুন
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target Track Filter */}
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            aria-label="Filter by target track"
            className="text-xs bg-[#0d1219] border border-[#263142] rounded-lg px-2.5 py-2 text-[#cbd5e1] focus:outline-none focus:border-[#f5c66b]"
          >
            <option value="all">সকল ট্র্যাক (All Tracks)</option>
            <option value="BCS_GOVT">বিসিএস ও সরকারি চাকরি</option>
            <option value="ADMISSION">বিশ্ববিদ্যালয় ভর্তি</option>
            <option value="RESEARCH">গবেষণা ও পলিসি</option>
            <option value="GENERAL_KNOWLEDGE">সাধারণ জ্ঞান</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by account status"
            className="text-xs bg-[#0d1219] border border-[#263142] rounded-lg px-2.5 py-2 text-[#cbd5e1] focus:outline-none focus:border-[#f5c66b]"
          >
            <option value="all">সকল স্ট্যাটাস (All Status)</option>
            <option value="active">সক্রিয় (Active)</option>
            <option value="suspended">স্থগিত (Suspended)</option>
            <option value="pending">বিচারাধীন (Pending)</option>
          </select>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter by user role"
            className="text-xs bg-[#0d1219] border border-[#263142] rounded-lg px-2.5 py-2 text-[#cbd5e1] focus:outline-none focus:border-[#f5c66b]"
          >
            <option value="all">সকল রোল (All Roles)</option>
            <option value="student">শিক্ষার্থী (Student)</option>
            <option value="moderator">মডারেটর (Moderator)</option>
            <option value="admin">অ্যাডমিন (Admin)</option>
          </select>

          <button
            type="button"
            onClick={() => {
              loadStats();
              loadUsers(currentPage);
            }}
            disabled={loading}
            className="p-2 bg-[#1e293b] hover:bg-[#283548] text-[#cbd5e1] rounded-lg border border-[#334155] transition"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#f5c66b]" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateError("");
              setShowCreateModal(true);
            }}
            className="px-3 py-2 bg-[#842323] hover:bg-[#992929] text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>নতুন ব্যবহারকারী যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* 3. User Accounts Data Table */}
      <div className="bg-[#141b24] border border-[#212936] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0f141c] text-[#8e9aa8] border-b border-[#212936] uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3 font-semibold">ব্যবহারকারী / প্রোফাইল</th>
                <th className="px-4 py-3 font-semibold">ইমেইল (@gmail.com) & ফোন</th>
                <th className="px-4 py-3 font-semibold">ট্র্যাক ও প্রতিষ্ঠান</th>
                <th className="px-4 py-3 font-semibold">রোল (অনুমতি)</th>
                <th className="px-4 py-3 font-semibold">অধ্যয়ন ডেটা (Study Activity)</th>
                <th className="px-4 py-3 font-semibold">স্ট্যাটাস</th>
                <th className="px-4 py-3 font-semibold text-right">নিয়ন্ত্রণ অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212936]">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#64748b]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#f5c66b]" />
                    <span>ব্যবহারকারী তালিকা লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#64748b]">
                    কোনো ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initials = u.name
                    ? u.name
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((n: string) => n[0] || "")
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U";

                  const isRowUpdating = updatingRowId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#1a2330]/60 transition">
                      {/* Name & Basic info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center font-bold text-[#f5c66b] text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {u.name}
                            </div>
                            <span className="text-[10px] text-[#64748b]">
                              যুক্ত: {u.createdAt ? new Date(u.createdAt).toLocaleDateString("bn-BD") : "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-white flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#38bdf8]" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone ? (
                          <div className="text-[11px] text-[#94a3b8] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#4ade80]" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#64748b]">ফোন নম্বর নেই</span>
                        )}
                      </td>

                      {/* Track & Institution */}
                      <td className="px-4 py-3">
                        <span className="inline-block bg-[#1e293b] text-[#f5c66b] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#334155]">
                          {u.targetTrack === "BCS_GOVT"
                            ? "বিসিএস ও চাকরি"
                            : u.targetTrack === "ADMISSION"
                            ? "বিশ্ববিদ্যালয় ভর্তি"
                            : u.targetTrack === "RESEARCH"
                            ? "গবেষণা ও পলিসি"
                            : "সাধারণ জ্ঞান"}
                        </span>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5 truncate max-w-[160px]">
                          {u.institution || "প্রতিষ্ঠান অনুল্লিখিত"}
                        </div>
                      </td>

                      {/* Live Role Selector */}
                      <td className="px-4 py-3">
                        <select
                          disabled={isRowUpdating}
                          value={u.role || "student"}
                          onChange={(e) => handleChangeRole(u, e.target.value as any)}
                          aria-label="ব্যবহারকারীর রোল পরিবর্তন করুন"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border cursor-pointer outline-none transition disabled:opacity-50 ${
                            u.role === "admin"
                              ? "bg-red-950/80 text-red-300 border-red-700/60"
                              : u.role === "moderator"
                              ? "bg-blue-950/80 text-blue-300 border-blue-700/60"
                              : "bg-[#1e293b] text-[#cbd5e1] border-[#334155]"
                          }`}
                          title="রোল পরিবর্তন করতে ক্লিক করুন"
                        >
                          <option value="student">শিক্ষার্থী (Student)</option>
                          <option value="moderator">মডারেটর (Moderator)</option>
                          <option value="admin">অ্যাডমিন (Admin)</option>
                        </select>
                      </td>

                      {/* Study Activity Stats */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 text-[11px]">
                          <span className="flex items-center gap-1 text-amber-400 font-semibold" title="স্টাডি স্ট্রিক">
                            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                            {u.streakDays ?? 1} দিন
                          </span>
                          <span className="text-[#94a3b8]" title="সংরক্ষিত নোট">
                            নোট: {u._count?.notes ?? 0}
                          </span>
                          <span className="text-[#94a3b8]" title="বুকমার্ক প্রতিবেদন">
                            সংরক্ষণ: {u._count?.savedArticles ?? 0}
                          </span>
                          <span className="text-[#94a3b8]" title="কুইজ অংশগ্রহণ">
                            কুইজ: {u._count?.quizAttempts ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isRowUpdating}
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer border disabled:opacity-50 ${
                            u.status === "active"
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900"
                              : "bg-red-950/80 text-red-300 border-red-700/60 hover:bg-red-900"
                          }`}
                          title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                        >
                          {isRowUpdating ? (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                          )}
                          <span>{u.status === "active" ? "সক্রিয় (Active)" : "স্থগিত (Suspended)"}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(u.id)}
                            className="p-1.5 rounded bg-[#1e293b] hover:bg-[#283548] text-[#cbd5e1] hover:text-white transition"
                            title="বিস্তারিত প্রোফাইল দেখুন"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded bg-[#1e293b] hover:bg-[#283548] text-[#cbd5e1] hover:text-white transition"
                            title="অ্যাকাউন্ট সম্পাদনা করুন"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#f5c66b]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 transition"
                            title="অ্যাকাউন্ট মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-[#0f141c] border-t border-[#212936] flex items-center justify-between text-xs text-[#8e9aa8]">
            <span>মোট {totalUsers} জন ব্যবহারকারী (পৃষ্ঠা {currentPage} / {totalPages})</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => loadUsers(currentPage - 1)}
                className="px-2.5 py-1 bg-[#141b24] hover:bg-[#1e293b] text-white rounded border border-[#212936] disabled:opacity-40 transition"
              >
                পূর্ববর্তী
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => loadUsers(currentPage + 1)}
                className="px-2.5 py-1 bg-[#141b24] hover:bg-[#1e293b] text-white rounded border border-[#212936] disabled:opacity-40 transition"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL: View User Profile & Study Details */}
      {showDetailModal && (
        <div 
          onClick={() => setShowDetailModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141b24] border border-[#212936] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#212936] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#f5c66b]" />
                <h3 className="text-sm font-bold text-white">ব্যবহারকারী বিস্তারিত প্রোফাইল ও অগ্রগতি</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-[#64748b] hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !selectedUser ? (
              <div className="py-12 text-center text-[#64748b]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#f5c66b]" />
                <span>প্রোফাইল ডেটা লোড হচ্ছে...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Bio Card */}
                <div className="bg-[#0f141c] p-4 rounded-xl border border-[#212936] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedUser.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        selectedUser.role === "admin"
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : selectedUser.role === "moderator"
                          ? "bg-blue-950 text-blue-300 border border-blue-800"
                          : "bg-[#1e293b] text-[#cbd5e1] border border-[#334155]"
                      }`}>
                        {selectedUser.role}
                      </span>
                    </h4>
                    <p className="text-xs text-[#38bdf8] font-mono mt-0.5">{selectedUser.email}</p>
                    {selectedUser.phone && (
                      <p className="text-[11px] text-[#94a3b8] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#4ade80]" />
                        {selectedUser.phone}
                      </p>
                    )}
                    <p className="text-[11px] text-[#64748b] mt-1">
                      প্রতিষ্ঠান: {selectedUser.institution || "অনুল্লিখিত"} • ট্র্যাক: {selectedUser.targetTrack}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      selectedUser.status === "active"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                        : "bg-red-950 text-red-300 border-red-700"
                    }`}>
                      স্ট্যাটাস: {selectedUser.status}
                    </span>
                    <p className="text-amber-400 font-bold text-xs mt-1.5 flex items-center justify-end gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {selectedUser.streakDays ?? 1} দিন স্ট্রিক
                    </p>
                  </div>
                </div>

                {/* User Bio if present */}
                {selectedUser.bio && (
                  <div className="bg-[#0f141c] p-3 rounded-lg border border-[#212936]">
                    <span className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider block mb-1">
                      বায়ো / পরিচিতি
                    </span>
                    <p className="text-xs text-[#cbd5e1] leading-relaxed">{selectedUser.bio}</p>
                  </div>
                )}

                {/* Study Notes Excerpts */}
                <div>
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#f5c66b]" />
                    <span>সর্বশেষ স্টাডি নোট ও হাইলাইট ({selectedUser.notes?.length || 0})</span>
                  </h5>
                  {selectedUser.notes?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.notes.map((n: any) => (
                        <div key={n.id} className="bg-[#0f141c] p-2.5 rounded-lg border border-[#212936]">
                          <span className="text-[10px] text-[#f5c66b] font-medium block truncate">
                            {n.article?.title}
                          </span>
                          <p className="text-xs text-[#cbd5e1] italic mt-1 bg-[#1a2330] p-1.5 rounded">
                            "{n.quoteText}"
                          </p>
                          {n.memo && <p className="text-[11px] text-[#94a3b8] mt-1">নোট: {n.memo}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#64748b] italic">এখনও কোনো নোট নেননি।</p>
                  )}
                </div>

                {/* Quiz Attempts */}
                <div>
                  <h5 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#4ade80]" />
                    <span>কুইজ পারফরম্যান্স ({selectedUser.quizAttempts?.length || 0})</span>
                  </h5>
                  {selectedUser.quizAttempts?.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedUser.quizAttempts.map((q: any) => (
                        <div key={q.id} className="bg-[#0f141c] p-2 rounded border border-[#212936] flex items-center justify-between">
                          <span className="truncate max-w-sm text-[#cbd5e1]">{q.question?.question}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            q.isCorrect ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
                          }`}>
                            {q.isCorrect ? "সঠিক উত্তর" : "ভুল"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#64748b] italic">কোনো কুইজ প্রচেষ্টা রেকর্ড নেই।</p>
                  )}
                </div>

                {/* Saved Vocabulary */}
                {selectedUser.wordBank?.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>সংরক্ষিত শব্দভাণ্ডার ({selectedUser.wordBank.length})</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.wordBank.map((w: any) => (
                        <span key={w.id} className="bg-[#0f141c] border border-[#212936] px-2.5 py-1 rounded text-[11px] text-[#cbd5e1]">
                          <strong className="text-white">{w.term?.term}</strong>: {w.term?.definition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL: Edit User Details */}
      {showEditModal && editingUser && (
        <div 
          onClick={() => setShowEditModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141b24] border border-[#212936] rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6 shadow-2xl text-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#212936] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#f5c66b]" />
                <span>ব্যবহারকারী তথ্য ও অনুমতি সম্পাদনা</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-[#64748b] hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-700/80 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[#8e9aa8] mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8e9aa8] mb-1">রোল (অনুমতি)</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  >
                    <option value="student">শিক্ষার্থী (Student)</option>
                    <option value="moderator">মডারেটর (Moderator)</option>
                    <option value="admin">অ্যাডমিন (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8e9aa8] mb-1">অ্যাকাউন্ট স্ট্যাটাস</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="suspended">স্থগিত (Suspended)</option>
                    <option value="pending">বিচারাধীন (Pending)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#8e9aa8] mb-1">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                />
              </div>

              <div>
                <label className="block text-[#8e9aa8] mb-1">শিক্ষা প্রতিষ্ঠান</label>
                <input
                  type="text"
                  value={editingUser.institution}
                  onChange={(e) => setEditingUser({ ...editingUser, institution: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8e9aa8] mb-1">প্রস্তুতি ট্র্যাক</label>
                  <select
                    value={editingUser.targetTrack}
                    onChange={(e) => setEditingUser({ ...editingUser, targetTrack: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  >
                    <option value="BCS_GOVT">বিসিএস ও সরকারি চাকরি</option>
                    <option value="ADMISSION">বিশ্ববিদ্যালয় ভর্তি</option>
                    <option value="RESEARCH">গবেষণা ও পলিসি</option>
                    <option value="GENERAL_KNOWLEDGE">সাধারণ জ্ঞান</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8e9aa8] mb-1">স্টাডি স্ট্রিক (দিন)</label>
                  <input
                    type="number"
                    value={editingUser.streakDays}
                    onChange={(e) => setEditingUser({ ...editingUser, streakDays: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8e9aa8] mb-1">বায়ো / পরিচিতি (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  value={editingUser.bio}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  placeholder="শিক্ষার্থীর লক্ষ্য বা সংক্ষিপ্ত বায়ো"
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b] resize-none"
                />
              </div>

              <div>
                <label className="block text-[#8e9aa8] mb-1 flex items-center justify-between">
                  <span>নতুন পাসওয়ার্ড নির্ধারণ (ঐচ্ছিক)</span>
                  <span className="text-[10px] text-[#64748b]">ফাঁকা রাখলে অপরিবর্তিত থাকবে</span>
                </label>
                <input
                  type="password"
                  value={editingUser.newPassword}
                  onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
                  placeholder="কমপক্ষে ৬ অক্ষর প্রদান করুন"
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  minLength={6}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-2 bg-[#1e293b] text-[#cbd5e1] rounded-lg hover:bg-[#283548] transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-[#842323] hover:bg-[#992929] text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>সংরক্ষণ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Create New User Account */}
      {showCreateModal && (
        <div 
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141b24] border border-[#212936] rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6 shadow-2xl text-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#212936] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#f5c66b]" />
                <span>নতুন ব্যবহারকারী অ্যাকাউন্ট তৈরি</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#64748b] hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-700/80 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block text-[#8e9aa8] mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  placeholder="যেমন: তানজিম আহমেদ"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#8e9aa8] mb-1 flex items-center justify-between">
                  <span>ইমেইল ঠিকানা (@gmail.com) *</span>
                  <span className="text-[10px] text-amber-400">@gmail.com আবশ্যক</span>
                </label>
                <input
                  type="email"
                  placeholder="student@gmail.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#8e9aa8] mb-1">পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)</label>
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড প্রদান করুন"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  required
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8e9aa8] mb-1">মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  />
                </div>

                <div>
                  <label className="block text-[#8e9aa8] mb-1">রোল</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  >
                    <option value="student">শিক্ষার্থী (Student)</option>
                    <option value="moderator">মডারেটর (Moderator)</option>
                    <option value="admin">অ্যাডমিন (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8e9aa8] mb-1">প্রস্তুতি ট্র্যাক</label>
                  <select
                    value={createForm.targetTrack}
                    onChange={(e) => setCreateForm({ ...createForm, targetTrack: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  >
                    <option value="BCS_GOVT">বিসিএস ও সরকারি চাকরি</option>
                    <option value="ADMISSION">বিশ্ববিদ্যালয় ভর্তি</option>
                    <option value="RESEARCH">গবেষণা ও পলিসি</option>
                    <option value="GENERAL_KNOWLEDGE">সাধারণ জ্ঞান</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8e9aa8] mb-1">স্ট্যাটাস</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="suspended">স্থগিত (Suspended)</option>
                    <option value="pending">বিচারাধীন (Pending)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#8e9aa8] mb-1">শিক্ষা প্রতিষ্ঠান (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="ঢাকা বিশ্ববিদ্যালয় / বুয়েট"
                  value={createForm.institution}
                  onChange={(e) => setCreateForm({ ...createForm, institution: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b]"
                />
              </div>

              <div>
                <label className="block text-[#8e9aa8] mb-1">বায়ো / পরিচিতি (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  value={createForm.bio}
                  onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                  placeholder="শিক্ষার্থীর লক্ষ্য বা সংক্ষিপ্ত বায়ো"
                  className="w-full text-xs px-3 py-2 bg-[#0d1219] border border-[#263142] rounded-lg text-white focus:outline-none focus:border-[#f5c66b] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 bg-[#1e293b] text-[#cbd5e1] rounded-lg hover:bg-[#283548] transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#842323] hover:bg-[#992929] text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <span>অ্যাকাউন্ট তৈরি করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
