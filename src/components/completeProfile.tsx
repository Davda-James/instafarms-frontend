import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import 'react-phone-number-input/style.css'; // Keep this for base styles
import '../assets/styles/PhoneInput.css'; // Your custom PhoneInput styles
import { useUser } from "@clerk/clerk-react";

// Cloudinary imports for potential future display (not directly used in upload form)
import { Cloudinary } from '@cloudinary/url-gen';
import { AdvancedImage } from '@cloudinary/react';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';


export default function CompleteProfile() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email : "",
    age: "",
    dob: "",
    country_code: "",
    phone: "",
    bio: "",
    avatarUrl: "", // This will store the public URL returned by Cloudinary after upload
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null); // State to hold the selected File object for upload
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null); // State for immediate image preview (Data URL)

  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // New state for toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });


  // Ref for the hidden file input to programmatically click it
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Cloudinary Configuration: Using environment variables ---
  const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // --- Backend API Endpoint (IMPORTANT: REPLACE WITH YOUR ACTUAL BACKEND ENDPOINT) ---
  const BACKEND_ADD_USER_URL = import.meta.env.VITE_BACKEND_ADD_USER_URL;

  useEffect(() => {
    if (user && user.emailAddresses && user.emailAddresses.length > 0) {
      const primaryEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId) || user.emailAddresses[0];
      setForm(prevForm => ({
        ...prevForm,
        email: primaryEmail.emailAddress,
      }));
      setTouched(prevTouched => ({ ...prevTouched, email: true }));
    }
  }, [user]);

  // Effect to manage toast visibility
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ message: '', type: null }); // Hide toast after 5 seconds
      }, 5000);
      return () => clearTimeout(timer); // Clean up timeout
    }
  }, [toast.message]);

  /**
   * Uploads a given file to Cloudinary using an unsigned upload preset.
   * @param {File} file The file object to upload.
   * @returns {Promise<string>} A promise that resolves with the secure URL of the uploaded image.
   * @throws {Error} If Cloudinary configuration is missing or upload fails.
   */
  const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error("Cloudinary environment variables (VITE_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET) are missing or empty. Please ensure your .env file is correctly set up and accessible.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "user_avatars");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary upload error response:", errorData);
        throw new Error(errorData.error?.message || `Failed to upload image to Cloudinary. Status: ${response.status}`);
      }
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error during Cloudinary upload operation:", error);
      throw error;
    }
  };

  /**
   * Validates the form fields and sets appropriate error messages.
   */
  const validate = (
    currentForm: typeof form = form,
    currentAvatarFile: File | null = avatarFile,
    currentAvatarUrl: string = form.avatarUrl
  ) => {
    const newErrors: { [key: string]: string } = {};

    if (!currentForm.first_name) newErrors.first_name = "First name is required.";
    if (!currentForm.last_name) newErrors.last_name = "Last name is required.";
    if (!currentForm.age || Number(currentForm.age) <= 0) newErrors.age = "Valid age required.";
    if (!currentForm.dob) newErrors.dob = "Date of birth required.";
    if (!currentForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentForm.email)) {
      newErrors.email = "Valid email is required.";
    }

    // Username validation (basic format and length)
    if (!currentForm.username) {
      newErrors.username = "Username is required.";
    } else if (currentForm.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long.";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(currentForm.username)) {
        newErrors.username = "Username can only contain letters, numbers, underscores, periods, or hyphens.";
    }

    if (!currentForm.phone || !currentForm.country_code || !isValidPhoneNumber(`+${currentForm.country_code}${currentForm.phone}`)) {
      newErrors.phone = "Valid phone number required.";
    }
    if (!currentForm.bio) newErrors.bio = "Bio is required.";
    if (!currentAvatarFile && !currentAvatarUrl) {
      newErrors.avatarUrl = "Avatar upload is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value.trimStart() };
    setForm(newForm);
    validate(newForm, avatarFile, form.avatarUrl);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validate(form, avatarFile, form.avatarUrl);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched({ ...touched, avatarUrl: true });
    const file = e.target.files?.[0];

    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        setAvatarPreviewUrl(previewUrl);
        setForm(prevForm => {
          const updatedForm = { ...prevForm, avatarUrl: previewUrl };
          validate(updatedForm, file, previewUrl);
          return updatedForm;
        });
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setForm(prevForm => {
        const updatedForm = { ...prevForm, avatarUrl: "" };
        validate(updatedForm, null, "");
        return updatedForm;
      });
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2 bg-slate-900 border ${
      touched[field] && errors[field] ? "border-red-500" : "border-slate-700"
    } rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
      touched[field] && errors[field] ? "focus:ring-red-500" : "focus:ring-indigo-500"
    }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      first_name: true,
      last_name: true,
      email : true,
      username: true,
      age: true,
      dob: true,
      phone: true,
      country_code: true,
      bio: true,
      avatarUrl: true,
    });

    const initialValidationForm = { ...form };
    if (avatarFile) initialValidationForm.avatarUrl = avatarPreviewUrl || "";

    if (validate(initialValidationForm, avatarFile, initialValidationForm.avatarUrl)) {
      setLoading(true);
      setToast({ message: '', type: null }); // Clear any previous toast

      let finalAvatarUrl = form.avatarUrl;

      if (avatarFile) {
        try {
          finalAvatarUrl = await uploadToCloudinary(avatarFile);
          setForm(prevForm => ({ ...prevForm, avatarUrl: finalAvatarUrl }));
          console.log("Avatar uploaded successfully to Cloudinary:", finalAvatarUrl);
        } catch (error) {
          console.error("Avatar upload failed during submission:", error);
          setErrors(prevErrors => ({ ...prevErrors, avatarUrl: `Upload failed: ${error instanceof Error ? error.message : String(error)}` }));
          setLoading(false);
          return;
        }
      }

      try {
        console.log("Clerk User ID:", user?.id);
        const dataToSend = { ...form, avatarUrl: finalAvatarUrl , clerkUserId: user?.id };
        const response = await fetch(BACKEND_ADD_USER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Include Clerk auth token if your backend uses it for user identification/auth
            // 'Authorization': `Bearer ${await user?.getToken()}`,
          },
          body: JSON.stringify(dataToSend),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Backend API error response:", errorData);

          // Check for specific username taken error from backend
          if (response.status === 409 && errorData.message && errorData.message.includes("username already exists")) {
            setErrors(prevErrors => ({ ...prevErrors, username: "This username is already taken." }));
            setToast({ message: "Username already taken. Please choose a different one.", type: 'error' });
          }
          // NEW: Check for specific email conflict error from backend
          else if (response.status === 409 && errorData.message && errorData.message.includes("Email is already in use.")) {
            setErrors(prevErrors => ({ ...prevErrors, email: "This email is already in use." }));
            setToast({ message: "Email is already in use. Please use a different email.", type: 'error' });
          }
          else {
            setErrors(prevErrors => ({ ...prevErrors, general: errorData.message || `Failed to save profile. Status: ${response.status}` }));
            setToast({ message: errorData.message || `Failed to save profile. Status: ${response.status}`, type: 'error' });
          }
          throw new Error(errorData.message || `Failed to save profile. Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Profile saved successfully:", result);
        setToast({ message: "Profile saved successfully!", type: 'success' }); // Success toast

        // Navigate after a short delay to allow toast to be seen
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500); // Give user time to see success message

      } catch (error) {
        console.error("Error saving profile to backend:", error);
        // If a specific error (like username/email conflict) was handled by setToast/setErrors above,
        // we don't need a general toast here.
        if (!toast.message && !(error instanceof Error && error.message.includes("username already exists")) && !(error instanceof Error && error.message.includes("Email is already in use."))) {
           setToast({ message: `Failed to save profile: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
           setErrors(prevErrors => ({ ...prevErrors, general: `Failed to save profile: ${error instanceof Error ? error.message : String(error)}` }));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const toastClasses = toast.type === 'success'
    ? 'bg-green-500 text-white'
    : 'bg-red-500 text-white';

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-20 flex justify-center items-center">
      <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500 opacity-30 rounded-full filter blur-[120px] z-0" />

      <div className="relative z-10 bg-slate-800/60 backdrop-blur-md rounded-2xl p-8 w-full max-w-lg shadow-xl border border-slate-700">
        {toast.type && toast.message && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-sm font-medium z-50 transition-all duration-300 ${toastClasses}`}
            style={{ opacity: toast.message ? 1 : 0 }}
          >
            {toast.message}
          </div>
        )}

        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-300">
          Complete Your Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: "First Name", name: "first_name", placeholder: "Enter your first name" },
            { label: "Last Name", name: "last_name", placeholder: "Enter your last name" },
            { label: "Email", name: "email", type: "email", placeholder: "Fetching email...", disabled: true },
            { label: "Age", name: "age", type: "number", placeholder: "Enter your age" },
            { label: "Date of Birth", name: "dob", type: "date", placeholder: "Select your date of birth" },
          ].map(({ label, name, type = "text", placeholder, disabled = false }) => (
            <div key={name}>
              <label className="block text-sm mb-1 text-slate-300">{label}</label>
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(name)}
                disabled={disabled}
              />
              {touched[name] && errors[name] && (
                <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
              )}
            </div>
          ))}

          {/* Username Input Field */}
          <div>
            <label className="block text-sm mb-1 text-slate-300">Username</label>
            <input
              type="text"
              name="username"
              placeholder="Choose a unique username"
              value={form.username}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClass("username")}
              maxLength={20}
            />
            {touched.username && errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Avatar Upload Section */}
          <div>
            <label className="block text-sm mb-1 text-slate-300">Avatar</label>
            <div
              className={`flex items-center space-x-4 p-3 rounded-lg border ${
                touched.avatarUrl && errors.avatarUrl ? "border-red-500" : "border-slate-700"
              } bg-slate-900`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
              >
                Upload Avatar
              </button>
              {avatarPreviewUrl ? (
                <img
                  src={avatarPreviewUrl}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-full object-cover border border-slate-600"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm">
                  No Image
                </div>
              )}
              <span className="text-slate-400 text-sm truncate">
                {avatarFile ? avatarFile.name : "No file selected"}
              </span>
            </div>
            {touched.avatarUrl && errors.avatarUrl && (
              <p className="text-red-500 text-xs mt-1">{errors.avatarUrl}</p>
            )}
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-sm mb-1 text-slate-300">Phone Number</label>
            <PhoneInput
              defaultCountry="IN"
              international
              value={form.country_code && form.phone ? `+${form.country_code}${form.phone}` : undefined}
              onChange={(value) => {
                if (value) {
                  try {
                    const parsed = parsePhoneNumberWithError(value);
                    setForm(prevForm => {
                      const updatedForm = {
                        ...prevForm,
                        phone: parsed.nationalNumber,
                        country_code: parsed.countryCallingCode,
                      };
                      validate(updatedForm);
                      return updatedForm;
                    });
                  } catch {
                    setForm(prevForm => {
                      const updatedForm = { ...prevForm, phone: "", country_code: "" };
                      validate(updatedForm);
                      return updatedForm;
                    });
                  }
                } else {
                  setForm(prevForm => {
                    const updatedForm = { ...prevForm, phone: "", country_code: "" };
                    validate(updatedForm);
                    return updatedForm;
                  });
                }
              }}
              onBlur={() => {
                setTouched({ ...touched, phone: true });
                validate(form);
              }}
              className={`phone-input-custom-style ${
                touched.phone && errors.phone ? "phone-input-error" : ""
              }`}
            />
            {touched.phone && errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Bio Textarea */}
          <div>
            <label className="block text-sm mb-1 text-slate-300">Bio</label>
            <textarea
              name="bio"
              rows={4}
              value={form.bio}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Tell us about yourself..."
              className={inputClass("bio")}
            />
            {touched.bio && errors.bio && (
                <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition duration-200 shadow-md disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save and Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
