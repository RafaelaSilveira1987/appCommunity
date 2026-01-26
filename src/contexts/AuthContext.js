import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import * as Crypto from 'expo-crypto';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
        
        // Buscar dados do usuário no banco
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        if (userError) {
          console.warn("Usuário autenticado mas sem perfil na tabela users:", userError);
          // Usuário existe no auth mas não tem registro em users
          // Você pode criar automaticamente ou pedir para contatar admin
        }

        if (userData) {
          setIsAdmin(userData.is_admin || false);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      setLoading(true);

      // Buscar usuário por telefone na tabela users
      const { data: users, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .eq("is_active", true); // Apenas usuários ativos

      if (searchError) {
        console.error("Erro ao buscar usuário:", searchError);
        return { success: false, message: "Erro ao buscar usuário" };
      }

      if (!users || users.length === 0) {
        return { success: false, message: "Usuário não encontrado" };
      }

      const userData = users[0];

      // Hash da senha fornecida para comparar
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );

      // Comparar senha hasheada
      if (userData.password !== hashedPassword) {
        return { success: false, message: "Senha incorreta" };
      }

      // Registrar último login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userData.id);

      // Criar sessão manual (já que não estamos usando Supabase Auth)
      setUser(userData);
      setIsAdmin(userData.is_admin || false);

      if (userData.must_change_password) {
        return {
          success: true,
          requirePasswordChange: true,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return { success: false, message: "Erro ao fazer login" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setIsAdmin(false);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const requestAccess = async (formData) => {
    try {
      const { error } = await supabase.from("access_requests").insert([
        {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          sector: formData.group,
          password: formData.password, // Senha será hasheada quando aprovada
          status: 'pending',
        },
      ]);

      if (error) {
        console.error("Erro ao enviar solicitação:", error);
        return { success: false, message: "Erro ao enviar solicitação" };
      }

      return { success: true, message: "Solicitação enviada com sucesso!" };
    } catch (error) {
      console.error("Erro:", error);
      return { success: false, message: "Erro ao enviar solicitação" };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, login, logout, requestAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};