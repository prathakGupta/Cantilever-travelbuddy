import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { activityAPI } from "../services/api";
import Navigation from "../components/Navigation";

function ActivityEdit() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    time: "",
    participantLimit: 10,
    category: "dinner",
    tags: "",
  });

  useEffect(() => {
    fetchActivity();
    fetchCategories();
    // eslint-disable-next-line
  }, [id]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const response = await activityAPI.getActivity(id);
      setActivity(response.data);
      setForm({
        title: response.data.title || "",
        description: response.data.description || "",
        location: response.data.location || "",
        time: response.data.time ? response.data.time.slice(0, 16) : "",
        participantLimit: response.data.participantLimit || 10,
        category: response.data.category || "dinner",
        tags: response.data.tags ? response.data.tags.join(", ") : "",
      });
    } catch (err) {
      setError("Failed to load activity. You may not have permission to edit this activity.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await activityAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      // ignore
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Only allow creator to edit
      if (!activity || activity.creator._id !== user._id) {
        setError("You are not authorized to edit this activity.");
        setSaving(false);
        return;
      }
      const tagsArray = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      await activityAPI.updateActivity(id, {
        ...form,
        tags: tagsArray,
      });
      navigate(`/activity/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update activity");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading activity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activity || activity.creator._id !== user._id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              You are not authorized to edit this activity
            </h3>
            <button
              onClick={() => navigate(`/activity/${id}`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Activity
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Activity</h2>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={4}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Time</label>
            <input
              type="datetime-local"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Participant Limit</label>
            <input
              type="number"
              name="participantLimit"
              value={form.participantLimit}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={2}
              max={100}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActivityEdit;
