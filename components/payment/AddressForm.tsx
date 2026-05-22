'use client';

import { useState, useCallback } from 'react';
import { fetchAddressFromCEP, formatCEP } from '@/lib/viacep';

export interface AddressData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: string;
  state: string;
  postalCode: string;
}

interface AddressFormProps {
  onSubmit: (data: AddressData) => void;
  isLoading?: boolean;
}

export default function AddressForm({ onSubmit, isLoading = false }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressData>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<AddressData>>({});

  const handleCEPChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    setFormData(prev => ({ ...prev, postalCode: cep }));

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setCepLoading(true);
      const addressData = await fetchAddressFromCEP(cep);
      setCepLoading(false);

      if (addressData) {
        setFormData(prev => ({
          ...prev,
          address: addressData.logradouro,
          province: addressData.bairro,
          city: addressData.localidade,
          state: addressData.uf,
        }));
      }
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressData> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
    if (!formData.addressNumber.trim()) newErrors.addressNumber = 'Número é obrigatório';
    if (!formData.province.trim()) newErrors.province = 'Bairro é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'CEP é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpar erro do campo quando começar a digitar
    if (errors[name as keyof AddressData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nome Completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* CPF */}
        <div>
          <label htmlFor="cpf" className="block text-sm font-medium mb-1">
            CPF (sem formatação)
          </label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            placeholder="11999999999"
            value={formData.cpf}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* CEP */}
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
            CEP
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            placeholder="12345-678"
            value={formatCEP(formData.postalCode)}
            onChange={handleCEPChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || cepLoading}
          />
          {cepLoading && <p className="text-blue-500 text-xs mt-1">Buscando endereço...</p>}
          {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
        </div>

        {/* Endereço */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">
            Endereço
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || cepLoading}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {/* Número */}
        <div>
          <label htmlFor="addressNumber" className="block text-sm font-medium mb-1">
            Número
          </label>
          <input
            id="addressNumber"
            name="addressNumber"
            type="text"
            value={formData.addressNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.addressNumber && <p className="text-red-500 text-xs mt-1">{errors.addressNumber}</p>}
        </div>

        {/* Complemento */}
        <div>
          <label htmlFor="complement" className="block text-sm font-medium mb-1">
            Complemento (opcional)
          </label>
          <input
            id="complement"
            name="complement"
            type="text"
            value={formData.complement}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Bairro */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium mb-1">
            Bairro
          </label>
          <input
            id="province"
            name="province"
            type="text"
            value={formData.province}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || cepLoading}
          />
          {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
        </div>

        {/* Cidade */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || cepLoading}
          />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium mb-1">
            Estado (UF)
          </label>
          <input
            id="state"
            name="state"
            type="text"
            placeholder="SP"
            value={formData.state}
            onChange={handleChange}
            maxLength={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || cepLoading}
          />
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || cepLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processando...' : 'Confirmar Endereço'}
      </button>
    </form>
  );
}
