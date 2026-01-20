"use client";

import React from "react";

import LogoClube from "../../public/logo-clube-gestor.png";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Users, Tag, Calendar } from "lucide-react";

interface Coupon {
  code: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  usedBy: Array<{
    name: string;
    phone: string;
    email: string;
    cpfCnpj: string;
    usedAt: string;
  }>;
  createdAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Form states
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("100");
  const [newMaxUses, setNewMaxUses] = useState("10");

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      loadCoupons();
    } else {
      setLoading(false);
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
      });

      if (response.ok) {
        sessionStorage.setItem("admin_authenticated", "true");
        setIsAuthenticated(true);
        loadCoupons();
      } else {
        setAuthError("Usuário ou senha incorretos");
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121242]">
        <div className="flex flex-col items-center text-center pt-10">
          <Image
            src={LogoClube}
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
          src={LogoClube}
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
                <div className="w-12 h-12 rounded-lg bg-[#C0992E]/30 flex items-center justify-center">
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
              Criar Novo Cupom
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

        {/* Coupons Table */}
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCoupon(coupon)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                Ver Usuários
                              </Button>
                            </DialogTrigger>
                            {/* ... dentro do map de cupons ... */}
                            <DialogContent className="max-w-4xl w-[95vw] overflow-hidden flex flex-col">
                              {selectedCoupon && (
                                <div className="flex flex-col h-full">
                                  <DialogHeader className="mb-4">
                                    <DialogTitle className="text-[#121242] text-xl">
                                      Usuários que usaram o cupom:{" "}
                                      <span className="text-[#C0992E] font-bold">
                                        {selectedCoupon.code}
                                      </span>
                                    </DialogTitle>
                                  </DialogHeader>

                                  {/* Wrapper para permitir scroll horizontal na tabela */}
                                  <div className="rounded-md border border-slate-200 overflow-x-auto">
                                    <Table>
                                      <TableHeader className="bg-slate-50">
                                        <TableRow>
                                          <TableHead className="whitespace-nowrap">
                                            Nome
                                          </TableHead>
                                          <TableHead className="whitespace-nowrap">
                                            Telefone
                                          </TableHead>
                                          <TableHead className="whitespace-nowrap">
                                            Email
                                          </TableHead>
                                          <TableHead className="whitespace-nowrap">
                                            CPF/CNPJ
                                          </TableHead>
                                          <TableHead className="whitespace-nowrap text-right">
                                            Usado em
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {selectedCoupon.usedBy.length > 0 ? (
                                          selectedCoupon.usedBy.map((user) => (
                                            <TableRow key={user.email}>
                                              <TableCell className="font-medium whitespace-nowrap">
                                                {user.name}
                                              </TableCell>
                                              <TableCell className="whitespace-nowrap">
                                                {user.phone}
                                              </TableCell>
                                              <TableCell>
                                                {user.email}
                                              </TableCell>
                                              <TableCell className="whitespace-nowrap">
                                                {user.cpfCnpj}
                                              </TableCell>
                                              <TableCell className="text-right text-sm text-slate-600 whitespace-nowrap">
                                                {formatDate(user.usedAt)}
                                              </TableCell>
                                            </TableRow>
                                          ))
                                        ) : (
                                          <TableRow>
                                            <TableCell
                                              colSpan={5}
                                              className="text-center py-4 text-slate-500"
                                            >
                                              Nenhum uso registrado para este
                                              cupom.
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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
      </div>
    </div>
  );
}
