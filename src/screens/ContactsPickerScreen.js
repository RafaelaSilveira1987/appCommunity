import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, User, ArrowLeft, UserPlus } from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import { supabase } from '../lib/supabase';

export default function ContactsPickerScreen({ navigation, route }) {
  const { groupId } = route.params || {}; // Se for para adicionar em grupo
  
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);

  useEffect(() => {
    requestContactsPermission();
  }, []);

  async function requestContactsPermission() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        setHasPermission(true);
        await loadContacts();
      } else {
        setHasPermission(false);
        Alert.alert(
          'Permissão Negada',
          'O app precisa de acesso aos seus contatos para esta funcionalidade.',
          [
            { text: 'Cancelar', onPress: () => navigation.goBack() },
            { 
              text: 'Configurações', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
      }
    } catch (err) {
      console.error('Erro ao solicitar permissão:', err);
      Alert.alert('Erro', 'Não foi possível acessar os contatos.');
    } finally {
      setLoading(false);
    }
  }

  async function loadContacts() {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      if (data.length > 0) {
        // Filtrar contatos com telefone ou email
        const validContacts = data
          .filter(contact => {
            const hasPhone = contact.phoneNumbers && contact.phoneNumbers.length > 0;
            const hasEmail = contact.emails && contact.emails.length > 0;
            return hasPhone || hasEmail;
          })
          .map(contact => ({
            id: contact.id,
            name: contact.name || 'Sem nome',
            phoneNumbers: contact.phoneNumbers || [],
            emails: contact.emails || [],
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setContacts(validContacts);
        setFilteredContacts(validContacts);
        
        // Verificar quais já são usuários do app
        await checkExistingUsers(validContacts);
      }
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
      Alert.alert('Erro', 'Não foi possível carregar os contatos.');
    } finally {
      setLoading(false);
    }
  }

  async function checkExistingUsers(contactsList) {
    try {
      // Extrair todos os emails e telefones
      const allEmails = contactsList
        .flatMap(c => c.emails.map(e => e.email))
        .filter(Boolean);
      
      const allPhones = contactsList
        .flatMap(c => c.phoneNumbers.map(p => p.number))
        .filter(Boolean)
        .map(phone => phone.replace(/\D/g, '')); // Remover caracteres não numéricos

      // Buscar usuários existentes por email
      const { data: emailUsers } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .in('email', allEmails);

      // Buscar usuários existentes por telefone
      const { data: phoneUsers } = await supabase
        .from('users')
        .select('id, name, email, phone')
        .in('phone', allPhones);

      // Combinar resultados
      const existingUsers = [...(emailUsers || []), ...(phoneUsers || [])];

      // Marcar contatos que já são usuários
      const updatedContacts = contactsList.map(contact => {
        const matchedUser = existingUsers.find(user => {
          const emailMatch = contact.emails.some(e => e.email === user.email);
          const phoneMatch = contact.phoneNumbers.some(p => 
            p.number.replace(/\D/g, '') === user.phone?.replace(/\D/g, '')
          );
          return emailMatch || phoneMatch;
        });

        return {
          ...contact,
          isAppUser: !!matchedUser,
          userId: matchedUser?.id,
          appUserName: matchedUser?.name,
        };
      });

      setContacts(updatedContacts);
      setFilteredContacts(updatedContacts);
      
    } catch (err) {
      console.error('Erro ao verificar usuários:', err);
    }
  }

  function handleSearch(query) {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredContacts(filtered);
  }

  function toggleSelectContact(contact) {
    if (!contact.isAppUser) {
      Alert.alert('Aviso', 'Este contato ainda não usa o app.');
      return;
    }

    const isSelected = selectedContacts.some(c => c.id === contact.id);
    
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  }

  async function handleInviteContacts() {
    if (selectedContacts.length === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos um contato.');
      return;
    }

    if (groupId) {
      // Adicionar ao grupo
      try {
        const members = selectedContacts.map(contact => ({
          group_id: groupId,
          user_id: contact.userId,
        }));

        const { error } = await supabase
          .from('group_members')
          .insert(members);

        if (error) throw error;

        Alert.alert(
          'Sucesso',
          `${selectedContacts.length} contato(s) adicionado(s) ao grupo!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        
      } catch (err) {
        console.error('Erro ao adicionar:', err);
        Alert.alert('Erro', 'Não foi possível adicionar os contatos.');
      }
    } else {
      // Apenas exibir contatos selecionados
      const names = selectedContacts.map(c => c.appUserName || c.name).join(', ');
      Alert.alert('Contatos Selecionados', names);
    }
  }

  const renderContact = ({ item }) => {
    const isSelected = selectedContacts.some(c => c.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.contactCard,
          isSelected && styles.contactCardSelected,
          !item.isAppUser && styles.contactCardDisabled,
        ]}
        onPress={() => toggleSelectContact(item)}
      >
        <View style={styles.contactAvatar}>
          <User size={24} color={item.isAppUser ? '#fcd030' : '#ccc'} />
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          
          {item.isAppUser ? (
            <Text style={styles.contactStatus}>✓ Usa o app</Text>
          ) : (
            <Text style={styles.contactStatusInactive}>Não usa o app</Text>
          )}

          {item.phoneNumbers.length > 0 && (
            <Text style={styles.contactDetail}>
              {item.phoneNumbers[0].number}
            </Text>
          )}
          
          {item.emails.length > 0 && (
            <Text style={styles.contactDetail}>
              {item.emails[0].email}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fcd030" />
          <Text style={styles.loadingText}>Carregando contatos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <User size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            Permissão de contatos não concedida
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Selecionar Contatos</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar contato..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredContacts.filter(c => c.isAppUser).length} contatos no app
        </Text>
        {selectedContacts.length > 0 && (
          <Text style={styles.selectedText}>
            {selectedContacts.length} selecionado(s)
          </Text>
        )}
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <User size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum contato encontrado</Text>
          </View>
        )}
      />

      {/* Action Button */}
      {selectedContacts.length > 0 && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleInviteContacts}
        >
          <UserPlus size={20} color="#000" />
          <Text style={styles.actionButtonText}>
            {groupId ? 'Adicionar ao Grupo' : 'Confirmar Seleção'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  statsText: {
    fontSize: 14,
    color: '#666',
  },

  selectedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fcd030',
  },

  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },

  contactCardSelected: {
    borderWidth: 2,
    borderColor: '#fcd030',
  },

  contactCardDisabled: {
    opacity: 0.5,
  },

  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  contactInfo: {
    flex: 1,
  },

  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },

  contactStatus: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
    marginBottom: 2,
  },

  contactStatusInactive: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },

  contactDetail: {
    fontSize: 13,
    color: '#666',
  },

  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fcd030',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkmarkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  actionButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#fcd030',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  loadingText: {
    fontSize: 16,
    color: '#666',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },

  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});