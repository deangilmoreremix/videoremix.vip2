import React, { useState, useEffect } from "react";
import {
  Link2,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Shield,
} from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

interface ImportProduct {
  id: string;
  product_name: string;
  normalized_name: string;
  campaign_name: string;
  is_mapped: boolean;
  mapping_status: string;
  total_occurrences: number;
  unique_user_count: number;
  created_at: string;
}

interface App {
  id: string;
  name: string;
  slug: string;
  category: string;
  is_active: boolean;
}

interface AccessTier {
  id: string;
  tier_name: string;
  display_name: string;
  tier_level: number;
  badge_color: string;
}

interface ProductMapping {
  id: string;
  app_id: string;
  app_name: string;
  access_tier_id: string;
  tier_name: string;
  tier_display_name: string;
  is_verified: boolean;
}

const AdminProductMapping: React.FC = () => {
  const [products, setProducts] = useState<ImportProduct[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [tiers, setTiers] = useState<AccessTier[]>([]);
  const [mappings, setMappings] = useState<Record<string, ProductMapping[]>>(
    {},
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ImportProduct | null>(
    null,
  );
  const [showMappingModal, setShowMappingModal] = useState(false);

  const [mappingForm, setMappingForm] = useState({
    appId: "",
    tierId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, appsRes, tiersRes, mappingsRes] = await Promise.all([
        supabase
          .from("import_products")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("apps").select("*").eq("is_active", true).order("name"),
        supabase
          .from("access_tiers")
          .select("*")
          .eq("is_active", true)
          .order("tier_level"),
        supabase
          .from("product_app_mappings")
          .select(
            `
            id,
            import_product_id,
            app_id,
            access_tier_id,
            is_verified,
            apps!inner(name),
            access_tiers!inner(tier_name, display_name)
          `,
          )
          .eq("is_active", true),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (appsRes.data) setApps(appsRes.data);
      if (tiersRes.data) setTiers(tiersRes.data);

      if (mappingsRes.data) {
        const mappingsByProduct: Record<string, ProductMapping[]> = {};
        mappingsRes.data.forEach((m: any) => {
          if (!mappingsByProduct[m.import_product_id]) {
            mappingsByProduct[m.import_product_id] = [];
          }
          mappingsByProduct[m.import_product_id].push({
            id: m.id,
            app_id: m.app_id,
            app_name: m.apps.name,
            access_tier_id: m.access_tier_id,
            tier_name: m.access_tiers.tier_name,
            tier_display_name: m.access_tiers.display_name,
            is_verified: m.is_verified,
          });
        });
        setMappings(mappingsByProduct);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "mapped" && product.is_mapped) ||
      (filterStatus === "unmapped" && !product.is_mapped);

    return matchesSearch && matchesFilter;
  });

  const handleOpenMappingModal = (product: ImportProduct) => {
    setSelectedProduct(product);
    setMappingForm({ appId: "", tierId: "" });
    setShowMappingModal(true);
  };

  const handleCreateMapping = async () => {
    if (!selectedProduct || !mappingForm.appId || !mappingForm.tierId) return;

    try {
      const { error } = await supabase.from("product_app_mappings").insert({
        import_product_id: selectedProduct.id,
        app_id: mappingForm.appId,
        access_tier_id: mappingForm.tierId,
        is_verified: false,
        is_active: true,
      });

      if (error) throw error;

      await supabase
        .from("import_products")
        .update({
          is_mapped: true,
          mapping_status: "mapped",
        })
        .eq("id", selectedProduct.id);

      setShowMappingModal(false);
      loadData();
    } catch (error: any) {
      console.error("Error creating mapping:", error);
      alert("Failed to create mapping: " + error.message);
    }
  };

  const handleDeleteMapping = async (mappingId: string, productId: string) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;

    try {
      const { error } = await supabase
        .from("product_app_mappings")
        .delete()
        .eq("id", mappingId);

      if (error) throw error;

      const remainingMappings =
        mappings[productId]?.filter((m) => m.id !== mappingId) || [];

      if (remainingMappings.length === 0) {
        await supabase
          .from("import_products")
          .update({
            is_mapped: false,
            mapping_status: "unmapped",
          })
          .eq("id", productId);
      }

      loadData();
    } catch (error: any) {
      console.error("Error deleting mapping:", error);
      alert("Failed to delete mapping: " + error.message);
    }
  };

  const getTierBadgeColor = (tierName: string) => {
    const tier = tiers.find((t) => t.tier_name === tierName);
    return tier?.badge_color || "#3B82F6";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Product-to-App Mapping
          </h2>
          <p className="text-gray-400 mt-1">
            Map imported products to apps with access tiers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Total Products</p>
          <p className="text-2xl font-bold text-white mt-1">
            {products.length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Mapped</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {products.filter((p) => p.is_mapped).length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Unmapped</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {products.filter((p) => !p.is_mapped).length}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products or campaigns..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Products</option>
            <option value="mapped">Mapped Only</option>
            <option value="unmapped">Unmapped Only</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Product Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Campaign
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Users
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Mapped Apps
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30"
                >
                  <td className="px-6 py-4 text-sm text-white">
                    {product.product_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {product.campaign_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {product.unique_user_count || 0}
                  </td>
                  <td className="px-6 py-4">
                    {product.is_mapped ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mapped
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unmapped
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {mappings[product.id] && mappings[product.id].length > 0 ? (
                      <div className="space-y-1">
                        {mappings[product.id].map((mapping) => (
                          <div
                            key={mapping.id}
                            className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1 text-xs"
                          >
                            <span className="text-gray-300">
                              {mapping.app_name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span
                                className="px-2 py-0.5 rounded text-white text-xs"
                                style={{
                                  backgroundColor: getTierBadgeColor(
                                    mapping.tier_name,
                                  ),
                                }}
                              >
                                {mapping.tier_display_name}
                              </span>
                              <button
                                onClick={() =>
                                  handleDeleteMapping(mapping.id, product.id)
                                }
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No mappings</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleOpenMappingModal(product)}
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Mapping
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showMappingModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Add App Mapping
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Product:{" "}
              <span className="text-white">{selectedProduct.product_name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select App
                </label>
                <select
                  value={mappingForm.appId}
                  onChange={(e) =>
                    setMappingForm({ ...mappingForm, appId: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose an app...</option>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Tier
                </label>
                <select
                  value={mappingForm.tierId}
                  onChange={(e) =>
                    setMappingForm({ ...mappingForm, tierId: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a tier...</option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.display_name} (Level {tier.tier_level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMappingModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMapping}
                disabled={!mappingForm.appId || !mappingForm.tierId}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Create Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductMapping;
