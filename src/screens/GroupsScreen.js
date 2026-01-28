import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import GroupCard from "../components/GroupCard";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupsScreen({ navigation }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase.rpc("get_groups_with_unread", {
        current_user_id: user.id,
      });

      if (error) {
        console.error("Erro ao buscar grupos:", error);
        return;
      }

      setGroups(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Image
          source={require("../../assets/frontiers.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.container}>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={() => loadGroups(true)}
          ListHeaderComponent={() => (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Grupos e Comunidades</Text>
                <Text style={styles.subtitle}>
                  Conecte-se com seu setor na missão
                </Text>
              </View>
            </>
          )}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("GroupDetail", { group: item })
              }
            >
              <GroupCard group={item} index={index} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum grupo disponível</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },

  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  topBar: {
    backgroundColor: "#000",
    height: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    marginBottom: 20,
  },

  logoImage: {
    width: 200,
    height: 130,
  },

  // header: {
  //   marginBottom: 24,
  //   paddingBottom: 16,
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#eee',
  // },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },

  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },

  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 15,
    color: "#999",
  },
});