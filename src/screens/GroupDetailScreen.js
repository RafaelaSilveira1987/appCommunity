import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { sectorColors } from '../utils/sectorColors';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Settings, MessageCircle, Users as UsersIcon, X, Shield } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

export default function GroupDetailScreen({ route, navigation }) {
  const { group } = route.params;
  const { user } = useAuth();
  const color = sectorColors[group.name] || '#0047AB';

  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    await checkMembership();
    await loadMemberCount();
    setLoading(false);
  }

  async function checkMembership() {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar membership:', error);
        setIsMember(false);
      } else {
        setIsMember(data !== null);
      }
    } catch (err) {
      console.error('Erro na verificação:', err);
      setIsMember(false);
    }
  }

  async function loadMemberCount() {
    try {
      const { count, error } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      if (!error) {
        setMemberCount(count || 0);
      }
    } catch (err) {
      console.error('Erro ao contar membros:', err);
    }
  }

  async function loadMembers() {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          role,
          joined_at,
          users:user_id (
            id,
            name,
            email,
            sector,
            is_admin
          )
        `)
        .eq('group_id', group.id)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar membros:', error);
        return;
      }

      // Filtrar membros válidos e formatar dados
      const formattedMembers = data
        .filter(item => item.users !== null)
        .map(item => ({
          id: item.id,
          userId: item.users.id,
          name: item.users.name,
          email: item.users.email,
          sector: item.users.sector,
          role: item.role || 'member',
          isAdmin: item.users.is_admin,
          joinedAt: item.joined_at,
        }));

      setMembers(formattedMembers);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    } finally {
      setLoadingMembers(false);
    }
  }

  const handleShowMembers = async () => {
    setShowMembersModal(true);
    await loadMembers();
  };

  const handleNavigateToChat = () => {
    if (!isMember) {
      alert('Apenas membros podem acessar o chat do grupo.');
      return;
    }
    navigation.navigate('GroupChat', { group });
  };

  const renderMember = ({ item }) => {
    const isGroupAdmin = item.role === 'admin';
    
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.name}</Text>
            {item.isAdmin && (
              <View style={styles.adminBadge}>
                <Shield size={12} color="#fcd030" />
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
            {isGroupAdmin && (
              <View style={styles.groupAdminBadge}>
                <Text style={styles.groupAdminBadgeText}>MODERADOR</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberSector}>{item.sector || 'Sem setor'}</Text>
          <Text style={styles.memberDate}>
            Membro desde {new Date(item.joinedAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={color} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{group.name}</Text>

        <TouchableOpacity style={styles.settingsButton}>
          <Settings color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Imagem do Grupo */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/act.png')}
            style={styles.groupImage}
            resizeMode="cover"
          />
        </View>

        {/* Info do Grupo */}
        <View style={styles.groupInfo}>
          <View style={styles.groupIconContainer}>
            <View style={[styles.groupIcon, { backgroundColor: color }]}>
              <Text style={styles.groupIconText}>
                {group.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.groupName}>{group.name}</Text>
          
          <TouchableOpacity 
            style={styles.memberCountButton}
            onPress={handleShowMembers}
            activeOpacity={0.7}
          >
            <UsersIcon size={16} color="#0047AB" />
            <Text style={styles.memberCount}>
              {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.groupType}>
            Grupo {group.is_private ? 'Privado' : 'Público'}
          </Text>

          <Text style={styles.groupDescription}>
            {group.description || 'Espaço focado em discussão sobre temas relacionados ao grupo.'}
          </Text>
        </View>

        {/* Botão Entrar no Chat */}
        {isMember ? (
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: color }]}
            onPress={handleNavigateToChat}
            activeOpacity={0.8}
          >
            <MessageCircle color="#fff" size={20} style={styles.chatIcon} />
            <Text style={styles.chatButtonText}>ENTRAR NO CHAT</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.notMemberContainer}>
            <Text style={styles.notMemberText}>
              Você não é membro deste grupo
            </Text>
            <Text style={styles.notMemberSubtext}>
              Apenas membros podem acessar as conversas
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de Membros */}
      <Modal
        visible={showMembersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Membros do Grupo</Text>
              <TouchableOpacity
                onPress={() => setShowMembersModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loadingMembers ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={color} />
              </View>
            ) : (
              <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                contentContainerStyle={styles.membersList}
                ListEmptyComponent={() => (
                  <View style={styles.emptyMembers}>
                    <Text style={styles.emptyMembersText}>Nenhum membro encontrado</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#ffc107',
  },
  groupImage: {
    width: '80%',
    height: '80%',
    alignSelf: 'center',
    marginTop: 30,
  },
  groupInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  groupIconContainer: {
    marginTop: -40,
    marginBottom: 12,
  },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  groupIconText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  memberCountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#0047AB',
    fontWeight: '600',
  },
  groupType: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  groupDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatIcon: {
    marginRight: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notMemberContainer: {
    backgroundColor: '#fff3cd',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    alignItems: 'center',
  },
  notMemberText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 6,
    textAlign: 'center',
  },
  notMemberSubtext: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fcd030',
  },
  groupAdminBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupAdminBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberSector: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  memberDate: {
    fontSize: 11,
    color: '#999',
  },
  emptyMembers: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: 14,
    color: '#999',
  },
});