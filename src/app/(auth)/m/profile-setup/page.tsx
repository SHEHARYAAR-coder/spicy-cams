import ModelProfileForm from "@/components/auth/model-profile-form"

export default function ModelOnboardingPage() {
    return <ModelProfileForm isOnboarding={true} redirectPath="/dashboard" />
}
