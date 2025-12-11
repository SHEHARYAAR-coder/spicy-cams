import ModelProfileForm from "@/components/auth/model-profile-form"

export default function ProfileSetupPage() {
    return <ModelProfileForm isOnboarding={true} redirectPath="/dashboard" />
}
