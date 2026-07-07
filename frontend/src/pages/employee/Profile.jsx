import { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { profileAPI } from "../../api/services";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import StatusBadge from "../../components/ui/StatusBadge";
import { getInitials } from "../../utils/helpers";
import { Camera } from "lucide-react";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const { register, handleSubmit } = useForm({
    defaultValues: { mobileNumber: user?.mobileNumber },
  });

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const payload = new FormData();
      if (formData.mobileNumber)
        payload.append("mobileNumber", formData.mobileNumber);
      if (formData.password) payload.append("password", formData.password);
      if (photo) payload.append("profilePhoto", photo);

      const { data } = await profileAPI.update(payload);
      updateUser(data.data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-gray-500">Update your profile information</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="text-center">
          <div className="relative mx-auto mb-4 h-24 w-24">
            {user?.profilePhoto ? (
              <img
                src={`${import.meta.env.VITE_API_URL}/uploads/${user.profilePhoto}`}
                alt=""
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
                {getInitials(user?.fullName)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-gray-800 p-2 text-white">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files[0])}
              />
            </label>
          </div>
          <h2 className="text-lg font-semibold">{user?.fullName}</h2>
          <p className="text-sm text-gray-500">{user?.designation}</p>
          <div className="mt-2">
            <StatusBadge status={user?.status} />
          </div>
        </Card>

        <Card title="Editable Information" className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Mobile Number" {...register("mobileNumber")} />
            <Input
              label="New Password"
              type="password"
              {...register("password")}
              placeholder="Leave blank to keep current"
            />
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </form>
        </Card>
      </div>

      <Card title="Account Information (Read Only)">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500">Employee ID</dt>
            <dd className="font-medium">{user?.employeeId}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Department</dt>
            <dd className="font-medium">{user?.department}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Role</dt>
            <dd className="font-medium capitalize">{user?.role}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
