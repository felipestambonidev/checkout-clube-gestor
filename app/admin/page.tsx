"use client";

import React from "react"

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
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Form states
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("100");
  const [newMaxUses, setNewMaxUses] = useState("10");

  useEffect(() => {
    loadCoupons();
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total de Usos</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Cupons Ativos</p>
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
            <form onSubmit={handleCreateCoupon} className="flex gap-4">
              <Input
                placeholder="Código do cupom (ex: PROMO100)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                required
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Desconto %"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                min="1"
                max="100"
                required
                className="w-32"
              />
              <Input
                type="number"
                placeholder="Qtd máxima"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                min="1"
                required
                className="w-32"
              />
              <Button
                type="submit"
                disabled={creating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {creating ? "Criando..." : "Criar Cupom"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Coupons Table */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Lista de Cupons</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-slate-600 py-8">Carregando...</p>
            ) : coupons.length === 0 ? (
              <p className="text-center text-slate-600 py-8">
                Nenhum cupom cadastrado ainda
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.code}>
                      <TableCell className="font-mono font-semibold">
                        {coupon.code}
                      </TableCell>
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
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Usuários do cupom {selectedCoupon?.code}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              {selectedCoupon?.usedBy.length === 0 ? (
                                <p className="text-center text-slate-600 py-8">
                                  Nenhum usuário utilizou este cupom ainda
                                </p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Nome</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>Telefone</TableHead>
                                      <TableHead>CPF/CNPJ</TableHead>
                                      <TableHead>Usado em</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {selectedCoupon?.usedBy.map((user, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell className="text-sm">
                                          {user.email}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          {user.phone}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono">
                                          {user.cpfCnpj}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                          {formatDate(user.usedAt)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
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
