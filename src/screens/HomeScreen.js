import React, { useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Filter, Heart } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext"; // ✅ Importar AuthContext
import FeedCard from "../components/FeedCard";
import { formatDateBR } from "../utils/dateUtils";

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth(); // ✅ Pegar user do contexto

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para filtros
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState("all");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // ✅ Movido para o topo

  useFocusEffect(
    useCallback(() => {
      loadUserAndSectors();
    }, []),
  );

  React.useEffect(() => {
    loadPosts(true);
  }, [selectedSector, showOnlyFavorites]);

  async function loadUserAndSectors() {
    try {
      if (user) {
        setCurrentUserId(user.id);

        // Pegar is_admin direto do user do contexto ou buscar do banco
        let adminValue = user.is_admin === true;

        // Se não vier no contexto, buscar do banco
        if (user.is_admin === undefined) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("is_admin")
            .eq("id", user.id)
            .maybeSingle();

          adminValue = userData?.is_admin === true;
        }

        setIsAdmin(adminValue);
      } else {
        console.log("❌ Nenhum usuário no contexto");
      }

      // Carregar setores únicos
      const { data, error } = await supabase
        .from("users")
        .select("sector")
        .not("sector", "is", null);

      if (!error && data) {
        const uniqueSectors = [...new Set(data.map((u) => u.sector))].filter(
          Boolean,
        );
        setSectors(uniqueSectors);
      }
    } catch (err) {
      console.error("❌ Erro ao carregar setores:", err);
    }
  }

  async function loadPosts(reset = false) {
    if (!hasMore && !reset) return;

    try {
      if (reset) {
        setRefreshing(true);
        setPage(0);
        setHasMore(true);
      }

      const currentPage = reset ? 0 : page;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // 1. Buscar posts
      let query = supabase.from("posts").select(`
          id,
          content,
          created_at,
          pinned,
          author_id,
          users (
            name,
            sector
          )
        `);

      if (selectedSector !== "all") {
        query = query.filter("users.sector", "eq", selectedSector);
      }

      query = query
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data: postsData, error } = await query;

      if (error) {
        console.error("Erro posts:", error);
        return;
      }

      // 2. Buscar favoritos SOMENTE se usuário existir
      let favoriteIds = new Set();

      if (user?.id) {
        const { data: favs, error: favError } = await supabase
          .from("favorites")
          .select("post_id")
          .eq("user_id", user.id);

        if (favError) {
          console.error("Erro favoritos:", favError);
        }

        favoriteIds = new Set((favs || []).map((f) => f.post_id));
      }

      // 3. Montar lista final
      const formatted = postsData
        .filter((item) => item.users !== null)
        .map((item) => ({
          id: item.id,
          author: item.users.name,
          sector: item.users.sector,
          text: item.content,
          date: new Date(item.created_at).toLocaleDateString("pt-BR"),
          pinned: item.pinned,
          isFavorited: favoriteIds.has(item.id),
        }));

      const filteredPosts = showOnlyFavorites
        ? formatted.filter((post) => post.isFavorited)
        : formatted;

      setPosts((prev) => {
        if (reset) return filteredPosts;

        const map = new Map();
        [...prev, ...filteredPosts].forEach((post) => {
          map.set(post.id, post);
        });

        return Array.from(map.values());
      });

      setPage((prev) => prev + 1);
      setHasMore(filteredPosts.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const toggleFavorite = async (postId, currentlyFavorited) => {
    if (!user?.id) {
      return;
    }

    try {
      if (currentlyFavorited) {
        // Remover favorito
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Adicionar favorito
        const { error } = await supabase.from("favorites").insert({
          post_id: postId,
          user_id: user.id,
        });

        if (error) throw error;
      }

      // Atualizar estado local
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, isFavorited: !currentlyFavorited }
            : post,
        ),
      );
    } catch (err) {}
  };

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
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={() => loadPosts(true)}
          onEndReachedThreshold={0.3}
          onEndReached={() => loadPosts()}
          ListHeaderComponent={() => (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Feed Frontiers</Text>
                <Text style={styles.subtitle}>
                  Fique por dentro do que acontece na comunidade
                </Text>
              </View>

              {/* Botões de Filtro */}
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    showFilters && styles.filterButtonActive,
                  ]}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Filter size={18} color={showFilters ? "#fcd030" : "#666"} />
                  <Text
                    style={[
                      styles.filterButtonText,
                      showFilters && styles.filterButtonTextActive,
                    ]}
                  >
                    Filtros
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    showOnlyFavorites && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setShowOnlyFavorites(!showOnlyFavorites);
                    setPosts([]);
                    setPage(0);
                    setHasMore(true);
                  }}
                >
                  <Heart
                    size={18}
                    color={showOnlyFavorites ? "#fcd030" : "#666"}
                    fill={showOnlyFavorites ? "#fcd030" : "transparent"}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      showOnlyFavorites && styles.filterButtonTextActive,
                    ]}
                  >
                    Favoritas
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Filtro de Setores */}
              {showFilters && (
                <View style={styles.sectorFilter}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sectorScrollContent}
                  >
                    <TouchableOpacity
                      style={[
                        styles.sectorChip,
                        selectedSector === "all" && styles.sectorChipActive,
                      ]}
                      onPress={() => {
                        setSelectedSector("all");
                        setPosts([]);
                        setPage(0);
                        setHasMore(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.sectorChipText,
                          selectedSector === "all" &&
                            styles.sectorChipTextActive,
                        ]}
                      >
                        Todos
                      </Text>
                    </TouchableOpacity>

                    {sectors.map((sector) => (
                      <TouchableOpacity
                        key={sector}
                        style={[
                          styles.sectorChip,
                          selectedSector === sector && styles.sectorChipActive,
                        ]}
                        onPress={() => {
                          setSelectedSector(sector);
                          setPosts([]);
                          setPage(0);
                          setHasMore(true);
                        }}
                      >
                        <Text
                          style={[
                            styles.sectorChipText,
                            selectedSector === sector &&
                              styles.sectorChipTextActive,
                          ]}
                        >
                          {sector}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
          renderItem={({ item }) => (
            <FeedCard
              post={item}
              onRefresh={() => loadPosts(true)}
              onToggleFavorite={() => toggleFavorite(item.id, item.isFavorited)}
              isAdmin={isAdmin}
            />
          )}
          ListEmptyComponent={() =>
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {showOnlyFavorites
                    ? "Nenhuma mensagem favoritada ainda"
                    : "Nenhum post disponível"}
                </Text>
              </View>
            )
          }
          ListFooterComponent={() =>
            loading ? (
              <ActivityIndicator style={{ marginVertical: 20 }} />
            ) : hasMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} />
            ) : null
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CreatePost")}
        >
          <Plus size={26} color="#fcd030" />
        </TouchableOpacity>
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
  },

  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
    marginBottom: 20,
  },

  logoImage: {
    width: 200,
    height: 130,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#000",
  },

  subtitle: {
    fontSize: 15,
    color: "#777",
    marginTop: 6,
  },

  filterButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  filterButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },

  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  filterButtonTextActive: {
    color: "#fcd030",
  },

  sectorFilter: {
    marginBottom: 16,
  },

  sectorScrollContent: {
    paddingRight: 16,
    gap: 8,
  },

  sectorChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },

  sectorChipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },

  sectorChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  sectorChipTextActive: {
    color: "#fcd030",
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

  fab: {
    position: "absolute",
    bottom: -40,
    right: 24,
    backgroundColor: "#000",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
