// src/services/ApprovalService.js
import { supabase } from '../lib/supabase';
import * as Crypto from 'expo-crypto';

export const ApprovalService = {
  approveRequest: async (request) => {
    try {
      console.log('🔄 Iniciando aprovação do usuário:', request.name);

      const userId = generateUUID();
      console.log('📋 ID gerado:', userId);

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('name', request.sector)
        .single();

      if (groupError) {
        console.error('❌ Erro ao buscar grupo:', groupError);
        return {
          success: false,
          message: `Grupo "${request.sector}" não encontrado. Crie o grupo primeiro.`
        };
      }

      const groupId = groupData.id;
      console.log('✅ Grupo encontrado. ID:', groupId);

      const hashedPassword = await hashPassword(request.password);

      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          name: request.name,
          phone: request.phone,
          email: request.email,
          sector: request.sector,
          password: hashedPassword,
          is_admin: false,
          active: true,
          is_active: true,
          must_change_password: true,
          created_at: new Date().toISOString(),
        }]);

      if (userError) {
        console.error('❌ Erro ao criar usuário:', userError);
        return {
          success: false,
          message: 'Erro ao criar usuário: ' + userError.message
        };
      }

      console.log('✅ Usuário criado');

      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString(),
        }]);

      if (memberError) {
        console.error('❌ Erro ao adicionar ao grupo:', memberError);
        await supabase.from('users').delete().eq('id', userId);
        return {
          success: false,
          message: 'Erro ao adicionar ao grupo: ' + memberError.message
        };
      }

      console.log('✅ Usuário adicionado ao grupo');

      const { error: requestError } = await supabase
        .from('access_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (requestError) {
        console.error('⚠️ Erro ao atualizar solicitação:', requestError);
      }

      console.log('✅ Aprovação concluída!');

      return {
        success: true,
        message: 'Usuário aprovado e criado com sucesso!',
        userId: userId,
        groupId: groupId,
        credentials: {
          phone: request.phone,
          email: request.email,
          name: request.name,
        }
      };

    } catch (error) {
      console.error('❌ Erro geral:', error);
      return {
        success: false,
        message: 'Erro ao processar aprovação: ' + error.message
      };
    }
  },

  rejectRequest: async (requestId) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        return { 
          success: false, 
          message: 'Erro ao rejeitar: ' + error.message 
        };
      }

      return { success: true, message: 'Solicitação rejeitada' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Erro: ' + error.message 
      };
    }
  },

  getPendingRequests: async () => {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function hashPassword(password) {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    return hash;
  } catch (error) {
    console.error('Erro ao fazer hash:', error);
    throw error;
  }
}

export default ApprovalService;