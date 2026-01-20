"use client";

import React from "react";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Login Administrativo
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
                <p className="text-sm text-red-600 text-center">{authError}</p>
              )}
              <Button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loggingIn ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Painel Administrativo
          </h1>
          <p className="text-slate-600">
            Gerencie cupons e visualize quem os utilizou
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Tag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total de Cupons</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {coupons.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Other stats cards here */}
        </div>

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
                          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                            Esgotado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
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
                            <DialogContent>
                              {selectedCoupon && (
                                <div>
                                  <DialogHeader>
                                    <DialogTitle>Usuários que usaram o cupom {selectedCoupon.code}</DialogTitle>
                                  </DialogHeader>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>CPF/CNPJ</TableHead>
                                        <TableHead>Usado em</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedCoupon.usedBy.map((user) => (
                                        <TableRow key={user.email}>
                                          <TableCell>{user.name}</TableCell>
                                          <TableCell>{user.phone}</TableCell>
                                          <TableCell>{user.email}</TableCell>
                                          <TableCell>{user.cpfCnpj}</TableCell>
                                          <TableCell className="text-sm text-slate-600">
                                            {formatDate(user.usedAt)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
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
