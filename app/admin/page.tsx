"use client";

import React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Users, Tag, Calendar, Rocket, Trash2, UserPlus, CreditCard } from "lucide-react";

interface Coupon {
  code: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  usedBy: Array<{
    name: string;
    phone: string;
    email: string;
    company: string;
    cpfCnpj: string;
    usedAt: string;
  }>;
  createdAt: string;
}

interface Checkout {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  cpfCnpj: string;
  event: string;
  finalPrice: number;
  createdAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"workshop" | "acelerador" | "checkouts" | "checkout-custom">("workshop");

  // Workshop coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Acelerador coupons
  const [aceleradorCoupons, setAceleradorCoupons] = useState<Coupon[]>([]);
  const [loadingAcelerador, setLoadingAcelerador] = useState(true);
  const [creatingAcelerador, setCreatingAcelerador] = useState(false);

  // Checkouts sem cupom
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loadingCheckouts, setLoadingCheckouts] = useState(true);

  // Form states for Workshop
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("100");
  const [newMaxUses, setNewMaxUses] = useState("10");
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);

  // Form states for Acelerador
  const [newCodeAcelerador, setNewCodeAcelerador] = useState("");
  const [newDiscountAcelerador, setNewDiscountAcelerador] = useState("100");
  const [newMaxUsesAcelerador, setNewMaxUsesAcelerador] = useState("10");

  // State for removing user
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [confirmRemoveDialogOpen, setConfirmRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{ couponCode: string; userEmail: string; userName: string } | null>(null);

  // Checkout config states
  const [checkoutPrice, setCheckoutPrice] = useState("228.00");
  const [checkoutDescription, setCheckoutDescription] = useState("357603 Turma");
  const [configSaved, setConfigSaved] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  // Funcao para carregar config do servidor
  const loadCheckoutConfig = async () => {
    try {
      const response = await fetch("/api/checkout-config");
      const data = await response.json();
      if (data.success && data.config) {
        setCheckoutPrice(data.config.price.toString());
        setCheckoutDescription(data.config.description);
      }
    } catch (error) {
      console.error("Erro ao carregar config:", error);
    }
  };

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      loadCoupons();
      loadAceleradorCoupons();
      loadCheckouts();
      loadCheckoutConfig();
    } else {
      setLoading(false);
      setLoadingAcelerador(false);
      setLoadingCheckouts(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError("");

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Importante para receber cookies
      });

      if (response.ok) {
        sessionStorage.setItem("admin_authenticated", "true");
        setIsAuthenticated(true);
        loadCoupons();
        loadAceleradorCoupons();
        loadCheckouts();
        loadCheckoutConfig();
      } else {
        const data = await response.json();
        setAuthError(data.error || "Usuario ou senha incorretos");
      }
    } catch (error) {
      setAuthError("Erro ao fazer login");
    } finally {
      setLoggingIn(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons");
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("[v0] Error loading coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAceleradorCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons-acelerador");
      const data = await response.json();
      setAceleradorCoupons(data.coupons || []);
    } catch (error) {
      console.error("[v0] Error loading acelerador coupons:", error);
    } finally {
      setLoadingAcelerador(false);
    }
  };

  const loadCheckouts = async () => {
    try {
      const response = await fetch("/api/register-checkout");
      const data = await response.json();
      setCheckouts(data.checkouts || []);
    } catch (error) {
      console.error("[v0] Error loading checkouts:", error);
    } finally {
      setLoadingCheckouts(false);
    }
  };

  const handleDeleteCheckout = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cadastro?")) {
      return;
    }

    try {
      const response = await fetch("/api/register-checkout", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        loadCheckouts();
      }
    } catch (error) {
      console.error("[v0] Error deleting checkout:", error);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          discount: Number(newDiscount),
          maxUses: Number(newMaxUses),
        }),
      });

      if (response.ok) {
        setNewCode("");
        setNewDiscount("100");
        setNewMaxUses("10");
        loadCoupons();
      }
    } catch (error) {
      console.error("[v0] Error creating coupon:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom ${code}?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        loadCoupons();
      }
    } catch (error) {
      console.error("[v0] Error deleting coupon:", error);
    }
  };

  const handleCreateAceleradorCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAcelerador(true);

    try {
      const response = await fetch("/api/admin/coupons-acelerador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCodeAcelerador.toUpperCase(),
          discount: Number(newDiscountAcelerador),
          maxUses: Number(newMaxUsesAcelerador),
        }),
      });

      if (response.ok) {
        setNewCodeAcelerador("");
        setNewDiscountAcelerador("100");
        setNewMaxUsesAcelerador("10");
        loadAceleradorCoupons();
      }
    } catch (error) {
      console.error("[v0] Error creating acelerador coupon:", error);
    } finally {
      setCreatingAcelerador(false);
    }
  };

  const handleDeleteAceleradorCoupon = async (code: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom ${code}?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/coupons-acelerador", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        loadAceleradorCoupons();
      }
    } catch (error) {
      console.error("[v0] Error deleting acelerador coupon:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openRemoveConfirmation = (couponCode: string, userEmail: string, userName: string) => {
    setUserToRemove({ couponCode, userEmail, userName });
    setConfirmRemoveDialogOpen(true);
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;

    const { couponCode, userEmail } = userToRemove;
    setRemovingUser(userEmail);

    try {
      // Determinar qual API usar baseado no tipo de cupom
      const isAcelerador = aceleradorCoupons.some(c => c.code === couponCode);
      const apiUrl = isAcelerador ? "/api/admin/coupons-acelerador" : "/api/admin/coupons";

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, userEmail }),
      });

      if (response.ok) {
        // Atualizar a lista local removendo o usuário
        if (selectedCoupon) {
          const updatedUsedBy = selectedCoupon.usedBy.filter(
            (user) => user.email !== userEmail
          );
          setSelectedCoupon({
            ...selectedCoupon,
            usedBy: updatedUsedBy,
            usedCount: updatedUsedBy.length,
          });
        }

        // Recarregar os cupons para manter sincronizado
        if (isAcelerador) {
          loadAceleradorCoupons();
        } else {
          loadCoupons();
        }
      }
    } catch (error) {
      console.error("[v0] Error removing user:", error);
    } finally {
      setRemovingUser(null);
      setConfirmRemoveDialogOpen(false);
      setUserToRemove(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121242]">
        <div className="flex flex-col items-center text-center pt-10">
          <Image
            src="/logo-clube-gestor.png"
            alt="Clube Gestor"
            width={280}
            height={130}
            className="h-12 md:h-20 w-auto"
            priority
          />
        </div>
        <div className="flex items-center justify-center px-4 mt-10">
          <Card className="w-full max-w-md border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-[#121242]">
                Login Administrativo <br /> Clube Gestor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Usuário
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Senha
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
                {authError && (
                  <p className="text-sm text-red-600 text-center">
                    {authError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full bg-[#C0992E] hover:bg-[#C0992E] text-[#121242] cursor-pointer"
                >
                  {loggingIn ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121242]">
      <div className="flex flex-col items-center text-center pt-10">
        <Image
          src="/logo-clube-gestor.png"
          alt="Clube Gestor"
          width={280}
          height={130}
          className="h-12 md:h-20 w-auto"
          priority
        />
      </div>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Painel Administrativo - Clube Gestor
          </h1>
          <p className="text-[#c0992e]">
            Gerencie cupons e visualize quem os utilizou
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            onClick={() => setActiveTab("workshop")}
            className={`px-6 py-3 font-medium cursor-pointer ${
              activeTab === "workshop"
                ? "bg-[#C0992E] text-[#121242]"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Tag className="w-4 h-4 mr-2" />
            Workshop Gestão do Tempo
          </Button>
          <Button
            onClick={() => setActiveTab("acelerador")}
            className={`px-6 py-3 font-medium cursor-pointer ${
              activeTab === "acelerador"
                ? "bg-[#C0992E] text-[#121242]"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Acelerador de Resultados
          </Button>
          <Button
            onClick={() => setActiveTab("checkouts")}
            className={`px-6 py-3 font-medium cursor-pointer ${
              activeTab === "checkouts"
                ? "bg-[#C0992E] text-[#121242]"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastros sem Cupom
          </Button>
          <Button
            onClick={() => setActiveTab("checkout-custom")}
            className={`px-6 py-3 font-medium cursor-pointer ${
              activeTab === "checkout-custom"
                ? "bg-[#C0992E] text-[#121242]"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Checkout Personalizado
          </Button>
        </div>

        {activeTab === "workshop" && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30 flex items-center justify-center">
                      <Tag className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Total de Cupons</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {coupons.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30  flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Cupons Utilizados</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {coupons.reduce((acc, c) => acc + c.usedCount, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30  flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Cupons Ativos</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {coupons.filter((c) => c.usedCount < c.maxUses).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Create Coupon Form */}
            <Card className="border-slate-200 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Novo Cupom - Workshop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Código do Cupom
                      </label>
                      <Input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="Ex: PROMO100"
                        required
                        className="uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Desconto (%)
                      </label>
                      <Input
                        type="number"
                        value={newDiscount}
                        onChange={(e) => setNewDiscount(e.target.value)}
                        placeholder="100"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quantidade de Usos
                      </label>
                      <Input
                        type="number"
                        value={newMaxUses}
                        onChange={(e) => setNewMaxUses(e.target.value)}
                        placeholder="10"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full md:w-auto bg-[#C0992E] hover:bg-[#C0992E]/30 text-[#121242] cursor-pointer"
                  >
                    {creating ? "Criando..." : "Criar Cupom"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "acelerador" && (
          <>
            {/* Stats Cards - Acelerador */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Total de Cupons</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {aceleradorCoupons.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30  flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Cupons Utilizados</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {aceleradorCoupons.reduce((acc, c) => acc + c.usedCount, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30  flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Cupons Ativos</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {aceleradorCoupons.filter((c) => c.usedCount < c.maxUses).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Create Coupon Form - Acelerador */}
            <Card className="border-slate-200 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Novo Cupom - Acelerador de Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAceleradorCoupon} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Código do Cupom
                      </label>
                      <Input
                        type="text"
                        value={newCodeAcelerador}
                        onChange={(e) => setNewCodeAcelerador(e.target.value)}
                        placeholder="Ex: ACELERADOR100"
                        required
                        className="uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Desconto (%)
                      </label>
                      <Input
                        type="number"
                        value={newDiscountAcelerador}
                        onChange={(e) => setNewDiscountAcelerador(e.target.value)}
                        placeholder="100"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quantidade de Usos
                      </label>
                      <Input
                        type="number"
                        value={newMaxUsesAcelerador}
                        onChange={(e) => setNewMaxUsesAcelerador(e.target.value)}
                        placeholder="10"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={creatingAcelerador}
                    className="w-full md:w-auto bg-[#C0992E] hover:bg-[#C0992E]/30 text-[#121242] cursor-pointer"
                  >
                    {creatingAcelerador ? "Criando..." : "Criar Cupom"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {/* Users Dialog - fora do map */}
        <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
            {selectedCoupon && (
              <>
                <DialogHeader className="shrink-0">
                  <DialogTitle className="text-[#121242] text-xl">
                    Usuários que usaram o cupom:{" "}
                    <span className="text-[#C0992E] font-bold">
                      {selectedCoupon.code}
                    </span>
                  </DialogTitle>
                  <p className="text-sm text-slate-500">
                    {selectedCoupon.usedBy.length}{" "}
                    {selectedCoupon.usedBy.length === 1
                      ? "pessoa utilizou"
                      : "pessoas utilizaram"}{" "}
                    este cupom
                  </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto rounded-md border border-slate-200 min-h-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="whitespace-nowrap font-semibold text-[#121242]">
                            Nome
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-[#121242]">
                            Telefone
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-[#121242]">
                            Email
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-[#121242]">
                            Empresa
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-[#121242]">
                            CPF/CNPJ
                          </TableHead>
                          <TableHead className="whitespace-nowrap font-semibold text-[#121242]">
                            Usado em
                          </TableHead>
                          <TableHead className="whitespace-nowrap text-center font-semibold text-[#121242]">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCoupon.usedBy.length > 0 ? (
                          selectedCoupon.usedBy.map((user, index) => (
                            <TableRow
                              key={`${user.email}-${index}`}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <TableCell className="font-medium whitespace-nowrap">
                                {user.name}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-slate-600">
                                {user.phone}
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {user.email}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-slate-600">
                                {user.company || "-"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-slate-600">
                                {user.cpfCnpj}
                              </TableCell>
                              <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                                {formatDate(user.usedAt)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRemoveConfirmation(selectedCoupon.code, user.email, user.name)}
                                  disabled={removingUser === user.email}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-slate-500"
                            >
                              Nenhum uso registrado para este cupom.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Coupons Table - Workshop */}
        {activeTab === "workshop" && (
          <Card className="border-slate-200">
            <CardContent>
              {loading ? (
                <p className="text-center text-slate-600">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.code}>
                        <TableCell>{coupon.code}</TableCell>
                        <TableCell>{coupon.discount}%</TableCell>
                        <TableCell>
                          {coupon.usedCount} / {coupon.maxUses}
                        </TableCell>
                        <TableCell>
                          {coupon.usedCount >= coupon.maxUses ? (
                            <Badge
                              variant="secondary"
                              className="bg-red-50 text-red-700 border-red-200"
                            >
                              Esgotado
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              Ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(coupon.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCoupon(coupon);
                                setUsersDialogOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Ver Usuários
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCoupon(coupon.code)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Coupons Table - Acelerador */}
        {activeTab === "acelerador" && (
          <Card className="border-slate-200">
            <CardContent>
              {loadingAcelerador ? (
                <p className="text-center text-slate-600">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aceleradorCoupons.map((coupon) => (
                      <TableRow key={coupon.code}>
                        <TableCell>{coupon.code}</TableCell>
                        <TableCell>{coupon.discount}%</TableCell>
                        <TableCell>
                          {coupon.usedCount} / {coupon.maxUses}
                        </TableCell>
                        <TableCell>
                          {coupon.usedCount >= coupon.maxUses ? (
                            <Badge
                              variant="secondary"
                              className="bg-red-50 text-red-700 border-red-200"
                            >
                              Esgotado
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              Ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(coupon.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCoupon(coupon);
                                setUsersDialogOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Ver Usuários
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAceleradorCoupon(coupon.code)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Checkouts sem Cupom Tab */}
        {activeTab === "checkouts" && (
          <>
            {/* Stats Cards - Checkouts */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Total de Cadastros</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {checkouts.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30 flex items-center justify-center">
                      <Tag className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Workshop</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {checkouts.filter((c) => c.event === "workshop").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30 flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-[#C0992E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#121242]">Acelerador</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {checkouts.filter((c) => c.event === "acelerador-de-resultados").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checkouts Table */}
            <Card className="border-slate-200">
              <CardContent>
                {loadingCheckouts ? (
                  <p className="text-center text-slate-600">Carregando...</p>
                ) : checkouts.length === 0 ? (
                  <p className="text-center text-slate-600 py-8">Nenhum cadastro sem cupom encontrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>CPF/CNPJ</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkouts.map((checkout) => (
                        <TableRow key={checkout.id}>
                          <TableCell className="font-medium">{checkout.name}</TableCell>
                          <TableCell>{checkout.phone}</TableCell>
                          <TableCell>{checkout.email}</TableCell>
                          <TableCell>{checkout.company}</TableCell>
                          <TableCell>{checkout.cpfCnpj}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                checkout.event === "workshop"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }
                            >
                              {checkout.event === "workshop" ? "Workshop" : "Acelerador"}
                            </Badge>
                          </TableCell>
                          <TableCell>R$ {checkout.finalPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {formatDate(checkout.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCheckout(checkout.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Excluir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Checkout Personalizado Tab */}
        {activeTab === "checkout-custom" && (
          <>
            <Card className="border-slate-200 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Configurar Checkout de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Como funciona:</strong>
                  </p>
                  <ul className="text-sm text-blue-600 list-disc list-inside space-y-1">
                    <li>Configure o valor e a descricao do pagamento abaixo</li>
                    <li>A descricao deve seguir o formato: <code className="bg-blue-100 px-1 rounded">ID Turma</code> ou <code className="bg-blue-100 px-1 rounded">ID Assinatura</code></li>
                    <li>Clique em Salvar para aplicar as configuracoes no checkout principal</li>
                    <li>A descricao sera enviada ao ASAAS e recebida pelo n8n para integracao com o Memberkit</li>
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Valor do Pagamento (R$)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={checkoutPrice}
                      onChange={(e) => {
                        setCheckoutPrice(e.target.value);
                        setConfigSaved(false);
                      }}
                      className="bg-white border-slate-300"
                      placeholder="228.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descricao do Pagamento (para Memberkit/n8n)
                    </label>
                    <Input
                      type="text"
                      value={checkoutDescription}
                      onChange={(e) => {
                        setCheckoutDescription(e.target.value);
                        setConfigSaved(false);
                      }}
                      className="bg-white border-slate-300"
                      placeholder="357603 Turma"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Formato: ID + Tipo (ex: 357603 Turma ou 123456 Assinatura)
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-700">
                    <strong>Configuracao atual:</strong>
                  </p>
                  <p className="text-lg font-semibold text-[#C0992E] mt-1">
                    R$ {parseFloat(checkoutPrice || "0").toFixed(2)} - {checkoutDescription || "Sem descricao"}
                  </p>
                </div>

                <div className="flex gap-4 items-center">
                  <Button
                    onClick={async () => {
                      setConfigSaving(true);
                      try {
                        const response = await fetch("/api/checkout-config", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          credentials: "include", // Usa cookies HTTP-only para autenticacao
                          body: JSON.stringify({
                            price: parseFloat(checkoutPrice),
                            description: checkoutDescription,
                          }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          setConfigSaved(true);
                          setTimeout(() => setConfigSaved(false), 3000);
                        } else {
                          alert("Erro ao salvar: " + (data.error || "Erro desconhecido"));
                        }
                      } catch (error) {
                        console.error("Erro ao salvar config:", error);
                        alert("Erro ao salvar configuracoes");
                      } finally {
                        setConfigSaving(false);
                      }
                    }}
                    disabled={configSaving}
                    className="bg-[#C0992E] hover:bg-[#C0992E]/80 text-[#121242] font-medium px-8 cursor-pointer disabled:opacity-50"
                  >
                    {configSaving ? "Salvando..." : "Salvar Configuracoes"}
                  </Button>
                  {configSaved && (
                    <span className="text-green-600 font-medium flex items-center">
                      Configuracoes salvas com sucesso!
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-2">Exemplos de descricao:</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <code className="text-sm font-mono text-[#C0992E]">357603 Turma</code>
                      <p className="text-xs text-slate-500 mt-1">Para turmas/cursos</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <code className="text-sm font-mono text-[#C0992E]">123456 Assinatura</code>
                      <p className="text-xs text-slate-500 mt-1">Para assinaturas recorrentes</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    <strong>Link do Checkout:</strong>{" "}
                    <a 
                      href="/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#C0992E] hover:underline"
                    >
                      Abrir Checkout Principal
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Modal de Confirmação de Remoção */}
        <Dialog open={confirmRemoveDialogOpen} onOpenChange={setConfirmRemoveDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#121242]">Confirmar Remoção</DialogTitle>
              <DialogDescription className="text-slate-600">
                Tem certeza que deseja remover <span className="font-semibold text-[#121242]">{userToRemove?.userName}</span> do cupom <span className="font-semibold text-[#D4AF37]">#{userToRemove?.couponCode}</span>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmRemoveDialogOpen(false);
                  setUserToRemove(null);
                }}
                disabled={removingUser !== null}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveUser}
                disabled={removingUser !== null}
                className="bg-red-600 hover:bg-red-700"
              >
                {removingUser !== null ? "Removendo..." : "Remover"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
