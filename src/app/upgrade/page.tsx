"use client";

import {
  Check,
  AlertCircle,
  Upload,
  Camera,
  FileText,
  Shield,
  Users,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface FormData {
  legalName: string;
  dateOfBirth: string;
  email: string;
  confirmEmail: string;
  stageName: string;
  idFrontImage: File | null;
  idBackImage: File | null;
  selfieImage: File | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  csamPolicyAccepted: boolean;
  conductPolicyAccepted: boolean;
  paymentMethod: string;
  paypalEmail: string;
  bankAccountName: string;
  cryptoWalletAddress: string;
  digitalSignature: string;
  signatureDate: string;
}

interface FormErrors {
  legalName?: string;
  dateOfBirth?: string;
  email?: string;
  confirmEmail?: string;
  stageName?: string;
  idFrontImage?: string;
  idBackImage?: string;
  selfieImage?: string;
  termsAccepted?: string;
  privacyAccepted?: string;
  csamPolicyAccepted?: string;
  conductPolicyAccepted?: string;
  paymentMethod?: string;
  paypalEmail?: string;
  bankAccountName?: string;
  cryptoWalletAddress?: string;
  digitalSignature?: string;
}

export default function UpgradePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    legalName: "",
    dateOfBirth: "",
    email: "",
    confirmEmail: "",
    stageName: "",

    // Identity Verification
    idFrontImage: null,
    idBackImage: null,
    selfieImage: null,

    // Agreement Acceptances
    termsAccepted: false,
    privacyAccepted: false,
    csamPolicyAccepted: false,
    conductPolicyAccepted: false,

    // Payment Information
    paymentMethod: "",
    paypalEmail: "",
    bankAccountName: "",
    cryptoWalletAddress: "",

    // Digital Signature
    digitalSignature: "",
    signatureDate: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const steps = [
    { id: 0, title: "Eligibility", icon: Shield },
    { id: 1, title: "Personal Info", icon: FileText },
    { id: 2, title: "ID Verification", icon: Camera },
    { id: 3, title: "Policies", icon: Users },
    { id: 4, title: "Payment", icon: FileText },
    { id: 5, title: "Sign", icon: Check },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (
    name: keyof FormData,
    checked: boolean | string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked === true || checked === "true",
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof FormData
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
      if (errors[fieldName as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    }
  };

  const validateStep = (step: number) => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!formData.legalName) newErrors.legalName = "Legal name is required";
        if (!formData.dateOfBirth)
          newErrors.dateOfBirth = "Date of birth is required";
        else {
          const age =
            new Date().getFullYear() -
            new Date(formData.dateOfBirth).getFullYear();
          if (age < 18)
            newErrors.dateOfBirth = "You must be at least 18 years old";
        }
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
          newErrors.email = "Invalid email format";
        if (formData.email !== formData.confirmEmail)
          newErrors.confirmEmail = "Emails do not match";
        if (!formData.stageName) newErrors.stageName = "Stage name is required";
        break;
      case 2:
        if (!formData.idFrontImage)
          newErrors.idFrontImage = "ID front photo is required";
        if (!formData.idBackImage)
          newErrors.idBackImage = "ID back photo is required";
        if (!formData.selfieImage)
          newErrors.selfieImage = "Selfie with ID is required";
        break;
      case 3:
        if (!formData.termsAccepted)
          newErrors.termsAccepted = "You must accept the Terms and Conditions";
        if (!formData.privacyAccepted)
          newErrors.privacyAccepted = "You must accept the Privacy Policy";
        if (!formData.csamPolicyAccepted)
          newErrors.csamPolicyAccepted = "You must accept the CSAM Policy";
        if (!formData.conductPolicyAccepted)
          newErrors.conductPolicyAccepted =
            "You must accept the Model Conduct Policy";
        break;
      case 4:
        if (!formData.paymentMethod)
          newErrors.paymentMethod = "Payment method is required";
        if (formData.paymentMethod === "paypal" && !formData.paypalEmail) {
          newErrors.paypalEmail = "PayPal email is required";
        }
        if (formData.paymentMethod === "bank" && !formData.bankAccountName) {
          newErrors.bankAccountName = "Account holder name is required";
        }
        if (
          formData.paymentMethod === "crypto" &&
          !formData.cryptoWalletAddress
        ) {
          newErrors.cryptoWalletAddress = "Crypto wallet address is required";
        }
        break;
      case 5:
        if (!formData.digitalSignature)
          newErrors.digitalSignature = "Digital signature is required";
        if (
          formData.digitalSignature &&
          formData.digitalSignature.toLowerCase() !==
          formData.legalName.toLowerCase()
        ) {
          newErrors.digitalSignature =
            "Signature must match your legal name exactly";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      // Here you would send data to your backend
      console.log("Form submitted:", formData);
      alert(
        "Application submitted successfully! Our team will review your application within 24-48 hours. You will receive an email confirmation shortly."
      );
    }
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-2">
              Become a Model
            </h1>
            <p className="text-lg text-gray-500">
              Join SpicyCams and start earning today
            </p>
            <Badge
              variant="secondary"
              className="mt-2 bg-purple-500/10 border-purple-500/20 text-purple-300"
            >
              Application Process
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium text-gray-300">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-gray-800" />
          </div>

          {/* Step Indicators */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === index;
                const isCompleted = currentStep > index;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                            ? "bg-green-500"
                            : isActive
                              ? "bg-purple-600"
                              : "bg-gray-700"
                          } text-white`}
                      >
                        {isCompleted ? (
                          <Check size={20} />
                        ) : (
                          <StepIcon size={20} />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 text-center hidden sm:block ${isActive
                            ? "font-semibold text-purple-400"
                            : "text-gray-500"
                          }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 ${isCompleted ? "bg-green-500" : "bg-gray-700"
                          }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="shadow-xl bg-gray-800/40 backdrop-blur-sm border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {currentStep === 0 &&
                  "Review eligibility requirements before starting"}
                {currentStep === 1 && "Provide your personal information"}
                {currentStep === 2 && "Upload identity verification documents"}
                {currentStep === 3 && "Read and accept all platform policies"}
                {currentStep === 4 && "Set up your payment preferences"}
                {currentStep === 5 && "Review and sign your application"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Step 0: Eligibility Check */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <Alert
                    variant="default"
                    className="border-yellow-500/50 bg-yellow-500/10"
                  >
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertTitle className="text-yellow-300">
                      Important Notice
                    </AlertTitle>
                    <AlertDescription className="text-yellow-200/80">
                      You must meet ALL of the following requirements to become
                      a model on SpicyCams
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                      <Check className="text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Age Requirement
                        </h4>
                        <p className="text-sm text-gray-300 mt-1">
                          You must be at least 18 years old (or the age of
                          majority in your jurisdiction, whichever is higher)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                      <Check className="text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Identity Verification
                        </h4>
                        <p className="text-sm text-gray-300 mt-1">
                          You must provide government-issued photo ID and
                          complete facial verification
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                      <Check className="text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Legal Capacity
                        </h4>
                        <p className="text-sm text-gray-300 mt-1">
                          You must have the legal capacity to enter into this
                          agreement
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                      <Check className="text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Content Compliance
                        </h4>
                        <p className="text-sm text-gray-300 mt-1">
                          Your content must comply with all applicable laws and
                          our platform policies
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                      <Check className="text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-white">
                          Equipment Requirements
                        </h4>
                        <p className="text-sm text-gray-300 mt-1">
                          You must have a webcam, stable internet connection,
                          and a private broadcasting space
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Full Name *</Label>
                    <Input
                      id="legalName"
                      name="legalName"
                      value={formData.legalName}
                      onChange={handleInputChange}
                      placeholder="As shown on your government ID"
                      className={errors.legalName ? "border-red-500" : ""}
                    />
                    {errors.legalName && (
                      <p className="text-sm text-red-500">{errors.legalName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={errors.dateOfBirth ? "border-red-500" : ""}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-red-500">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stageName">Stage Name / Model Name *</Label>
                    <Input
                      id="stageName"
                      name="stageName"
                      value={formData.stageName}
                      onChange={handleInputChange}
                      placeholder="Your public display name"
                      className={errors.stageName ? "border-red-500" : ""}
                    />
                    {errors.stageName && (
                      <p className="text-sm text-red-500">{errors.stageName}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      This will be your visible name to users
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">
                      Confirm Email Address *
                    </Label>
                    <Input
                      id="confirmEmail"
                      name="confirmEmail"
                      type="email"
                      value={formData.confirmEmail}
                      onChange={handleInputChange}
                      placeholder="Confirm your email"
                      className={errors.confirmEmail ? "border-red-500" : ""}
                    />
                    {errors.confirmEmail && (
                      <p className="text-sm text-red-500">
                        {errors.confirmEmail}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Identity Verification */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <Alert className="border-blue-500/50 bg-blue-500/10">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-blue-300">
                      Privacy Notice
                    </AlertTitle>
                    <AlertDescription className="text-blue-200/80">
                      Your identity documents are used for verification purposes
                      only and are stored securely. They will never be shared
                      publicly.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="idFrontImage">ID Front Photo *</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${errors.idFrontImage
                            ? "border-red-500/50 bg-red-500/10"
                            : "border-gray-600 hover:border-purple-500"
                          }`}
                      >
                        <Upload
                          className="mx-auto text-gray-500 mb-2"
                          size={32}
                        />
                        <p className="text-sm text-gray-300 mb-2">
                          Upload front of your ID
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Accepted: JPG, PNG, PDF (Max 5MB)
                        </p>
                        <Input
                          id="idFrontImage"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, "idFrontImage")}
                          className="max-w-xs mx-auto"
                        />
                        {formData.idFrontImage && (
                          <p className="text-green-400 text-sm mt-2 flex items-center justify-center">
                            <Check size={16} className="mr-1" />{" "}
                            {formData.idFrontImage.name}
                          </p>
                        )}
                      </div>
                      {errors.idFrontImage && (
                        <p className="text-sm text-red-500">
                          {errors.idFrontImage}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idBackImage">ID Back Photo *</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${errors.idBackImage
                            ? "border-red-500/50 bg-red-500/10"
                            : "border-gray-600 hover:border-purple-500"
                          }`}
                      >
                        <Upload
                          className="mx-auto text-gray-500 mb-2"
                          size={32}
                        />
                        <p className="text-sm text-gray-300 mb-2">
                          Upload back of your ID
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Accepted: JPG, PNG, PDF (Max 5MB)
                        </p>
                        <Input
                          id="idBackImage"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, "idBackImage")}
                          className="max-w-xs mx-auto"
                        />
                        {formData.idBackImage && (
                          <p className="text-green-400 text-sm mt-2 flex items-center justify-center">
                            <Check size={16} className="mr-1" />{" "}
                            {formData.idBackImage.name}
                          </p>
                        )}
                      </div>
                      {errors.idBackImage && (
                        <p className="text-sm text-red-500">
                          {errors.idBackImage}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="selfieImage">Selfie with ID *</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${errors.selfieImage
                            ? "border-red-500/50 bg-red-500/10"
                            : "border-gray-600 hover:border-purple-500"
                          }`}
                      >
                        <Camera
                          className="mx-auto text-gray-500 mb-2"
                          size={32}
                        />
                        <p className="text-sm text-gray-300 mb-2">
                          Take a selfie holding your ID next to your face
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Your face and ID must be clearly visible
                        </p>
                        <Input
                          id="selfieImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "selfieImage")}
                          className="max-w-xs mx-auto"
                        />
                        {formData.selfieImage && (
                          <p className="text-green-400 text-sm mt-2 flex items-center justify-center">
                            <Check size={16} className="mr-1" />{" "}
                            {formData.selfieImage.name}
                          </p>
                        )}
                      </div>
                      {errors.selfieImage && (
                        <p className="text-sm text-red-500">
                          {errors.selfieImage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review Policies */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <p className="text-gray-300">
                    Please read and accept all required policies to continue
                  </p>

                  <div className="space-y-4">
                    <Card
                      className={errors.termsAccepted ? "border-red-500" : ""}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="termsAccepted"
                            checked={formData.termsAccepted}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("termsAccepted", checked)
                            }
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor="termsAccepted"
                              className="text-base font-semibold cursor-pointer"
                            >
                              Terms and Conditions
                            </Label>
                            <p className="text-sm text-gray-300 mt-1">
                              I have read and agree to the Spicycams.live Terms
                              and Conditions, including the Performer Agreement.
                            </p>
                            <Button
                              variant="link"
                              className="px-0 h-auto text-purple-600 hover:text-purple-200/80"
                              asChild
                            >
                              <a href="#terms" target="_blank">
                                Read full Terms and Conditions →
                              </a>
                            </Button>
                          </div>
                        </div>
                        {errors.termsAccepted && (
                          <p className="text-sm text-red-500 mt-2">
                            {errors.termsAccepted}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card
                      className={errors.privacyAccepted ? "border-red-500" : ""}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="privacyAccepted"
                            checked={formData.privacyAccepted}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange("privacyAccepted", checked)
                            }
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor="privacyAccepted"
                              className="text-base font-semibold cursor-pointer"
                            >
                              Privacy Policy
                            </Label>
                            <p className="text-sm text-gray-300 mt-1">
                              I understand how my personal data will be
                              collected, used, and protected as outlined in the
                              Privacy Policy.
                            </p>
                            <Button
                              variant="link"
                              className="px-0 h-auto text-purple-600 hover:text-purple-200/80"
                              asChild
                            >
                              <a href="#privacy" target="_blank">
                                Read Privacy Policy →
                              </a>
                            </Button>
                          </div>
                        </div>
                        {errors.privacyAccepted && (
                          <p className="text-sm text-red-500 mt-2">
                            {errors.privacyAccepted}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card
                      className={
                        errors.csamPolicyAccepted ? "border-red-500" : ""
                      }
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="csamPolicyAccepted"
                            checked={formData.csamPolicyAccepted}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(
                                "csamPolicyAccepted",
                                checked
                              )
                            }
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor="csamPolicyAccepted"
                              className="text-base font-semibold cursor-pointer"
                            >
                              CSAM Zero-Tolerance Policy
                            </Label>
                            <Badge variant="destructive" className="ml-2">
                              Required
                            </Badge>
                            <p className="text-sm text-gray-300 mt-1">
                              I acknowledge the strict zero-tolerance policy
                              against Child Sexual Abuse Material and understand
                              that violations will result in permanent ban and
                              reporting to authorities.
                            </p>
                            <Button
                              variant="link"
                              className="px-0 h-auto text-purple-600 hover:text-purple-200/80"
                              asChild
                            >
                              <a href="#csam" target="_blank">
                                Read CSAM Policy →
                              </a>
                            </Button>
                          </div>
                        </div>
                        {errors.csamPolicyAccepted && (
                          <p className="text-sm text-red-500 mt-2">
                            {errors.csamPolicyAccepted}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card
                      className={
                        errors.conductPolicyAccepted ? "border-red-500" : ""
                      }
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="conductPolicyAccepted"
                            checked={formData.conductPolicyAccepted}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(
                                "conductPolicyAccepted",
                                checked
                              )
                            }
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor="conductPolicyAccepted"
                              className="text-base font-semibold cursor-pointer"
                            >
                              Model Conduct & Platform Policies
                            </Label>
                            <p className="text-sm text-gray-300 mt-1">
                              I will comply with all platform conduct rules
                              including verification requirements, free chat
                              guidelines, and prohibited content policies.
                            </p>
                            <Button
                              variant="link"
                              className="px-0 h-auto text-purple-600 hover:text-purple-200/80"
                              asChild
                            >
                              <a href="#conduct" target="_blank">
                                Read Conduct Policy →
                              </a>
                            </Button>
                          </div>
                        </div>
                        {errors.conductPolicyAccepted && (
                          <p className="text-sm text-red-500 mt-2">
                            {errors.conductPolicyAccepted}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 4: Payment Setup */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <p className="text-gray-300">
                    Set up how you'd like to receive your earnings
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">
                      Preferred Payment Method *
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        handleSelectChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger
                        className={errors.paymentMethod ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="bank">
                          Bank Transfer (Wire)
                        </SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.paymentMethod && (
                      <p className="text-sm text-red-500">
                        {errors.paymentMethod}
                      </p>
                    )}
                  </div>

                  {formData.paymentMethod === "paypal" && (
                    <div className="space-y-2">
                      <Label htmlFor="paypalEmail">PayPal Email *</Label>
                      <Input
                        id="paypalEmail"
                        name="paypalEmail"
                        type="email"
                        value={formData.paypalEmail}
                        onChange={handleInputChange}
                        placeholder="paypal@example.com"
                        className={errors.paypalEmail ? "border-red-500" : ""}
                      />
                      {errors.paypalEmail && (
                        <p className="text-sm text-red-500">
                          {errors.paypalEmail}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Make sure this email is associated with your PayPal
                        account
                      </p>
                    </div>
                  )}

                  {formData.paymentMethod === "bank" && (
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName">
                        Account Holder Name *
                      </Label>
                      <Input
                        id="bankAccountName"
                        name="bankAccountName"
                        value={formData.bankAccountName}
                        onChange={handleInputChange}
                        placeholder="Full name on bank account"
                        className={
                          errors.bankAccountName ? "border-red-500" : ""
                        }
                      />
                      {errors.bankAccountName && (
                        <p className="text-sm text-red-500">
                          {errors.bankAccountName}
                        </p>
                      )}
                      <Alert>
                        <AlertDescription>
                          Additional bank details (IBAN, SWIFT, etc.) will be
                          collected securely after approval
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {formData.paymentMethod === "crypto" && (
                    <div className="space-y-2">
                      <Label htmlFor="cryptoWalletAddress">
                        Crypto Wallet Address *
                      </Label>
                      <Input
                        id="cryptoWalletAddress"
                        name="cryptoWalletAddress"
                        value={formData.cryptoWalletAddress}
                        onChange={handleInputChange}
                        placeholder="Your wallet address"
                        className={
                          errors.cryptoWalletAddress ? "border-red-500" : ""
                        }
                      />
                      {errors.cryptoWalletAddress && (
                        <p className="text-sm text-red-500">
                          {errors.cryptoWalletAddress}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Currently supporting BTC, ETH, USDT
                      </p>
                    </div>
                  )}

                  <Separator />

                  <Alert className="bg-green-500/10 border-green-500/50">
                    <AlertTitle className="text-green-300">
                      Payment Terms
                    </AlertTitle>
                    <AlertDescription className="text-green-200/80">
                      <ul className="space-y-1 mt-2">
                        <li>• Payments are processed weekly (every Monday)</li>
                        <li>• Minimum payout threshold: $50 USD</li>
                        <li>
                          • Revenue share: 60% to models, 40% platform fee
                        </li>
                        <li>
                          • You are responsible for reporting earnings to tax
                          authorities
                        </li>
                        <li>• Processing time: 3-5 business days</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 5: Final Agreement */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <Alert className="bg-purple-500/10 border-purple-500/50">
                    <AlertTitle className="text-purple-300">
                      Summary of Your Application
                    </AlertTitle>
                    <AlertDescription className="text-purple-200/80">
                      <div className="space-y-1 mt-2">
                        <p>
                          <strong>Legal Name:</strong> {formData.legalName}
                        </p>
                        <p>
                          <strong>Stage Name:</strong> {formData.stageName}
                        </p>
                        <p>
                          <strong>Email:</strong> {formData.email}
                        </p>
                        <p>
                          <strong>Date of Birth:</strong> {formData.dateOfBirth}
                        </p>
                        <p>
                          <strong>Payment Method:</strong>{" "}
                          {formData.paymentMethod || "Not set"}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        I hereby certify that:
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <Check
                            className="text-green-400 mr-2 mt-0.5 flex-shrink-0"
                            size={18}
                          />
                          <span className="text-sm">
                            I am at least 18 years of age
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check
                            className="text-green-400 mr-2 mt-0.5 flex-shrink-0"
                            size={18}
                          />
                          <span className="text-sm">
                            All information provided is true and accurate
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check
                            className="text-green-400 mr-2 mt-0.5 flex-shrink-0"
                            size={18}
                          />
                          <span className="text-sm">
                            I have read and agree to all platform policies
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check
                            className="text-green-400 mr-2 mt-0.5 flex-shrink-0"
                            size={18}
                          />
                          <span className="text-sm">
                            I understand and accept the revenue share model
                            (60/40 split)
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check
                            className="text-green-400 mr-2 mt-0.5 flex-shrink-0"
                            size={18}
                          />
                          <span className="text-sm">
                            I consent to identity verification and ongoing
                            monitoring
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check
                            className="text-green-400 mr-2 mt-0.5 flex-shrink-0"
                            size={18}
                          />
                          <span className="text-sm">
                            I will provide facial verification each time I log
                            in
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Check
                            className="text-green-400 mr-2 mt-0.5 flex-shrink-0"
                            size={18}
                          />
                          <span className="text-sm">
                            I understand my content must comply with all
                            applicable laws
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label htmlFor="digitalSignature">
                      Digital Signature *
                    </Label>
                    <p className="text-sm text-gray-300">
                      Type your full legal name exactly as shown on your ID to
                      sign this agreement
                    </p>
                    <Input
                      id="digitalSignature"
                      name="digitalSignature"
                      value={formData.digitalSignature}
                      onChange={handleInputChange}
                      placeholder="Type your full legal name"
                      className={`font-serif text-xl ${errors.digitalSignature ? "border-red-500" : ""
                        }`}
                    />
                    {errors.digitalSignature && (
                      <p className="text-sm text-red-500">
                        {errors.digitalSignature}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signatureDate">Date</Label>
                    <Input
                      id="signatureDate"
                      value={formData.signatureDate}
                      disabled
                      className="bg-gray-800 text-gray-300"
                    />
                  </div>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important Legal Notice</AlertTitle>
                    <AlertDescription>
                      By signing below, you acknowledge that providing false
                      information or violating platform policies may result in
                      account termination, forfeiture of earnings, and potential
                      legal action.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-6">
              {currentStep > 0 ? (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="gap-2"
                >
                  <ChevronLeft size={16} />
                  Back
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    className="gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    Continue
                    <ChevronRight size={16} />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                  >
                    Submit Application
                    <Check size={16} />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>

          {/* Footer Links */}

            <div className="flex justify-center items-center gap-6 pt-4">
              <a
                href="https://www.rtalabel.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="bg-gray-800/30 px-4 py-2 rounded border border-gray-700/50">
                  <span className="text-xs font-semibold text-gray-200">
                    RTA Label
                  </span>
                </div>
              </a>
              <a
                href="https://www.asacp.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="bg-gray-800/30 px-4 py-2 rounded border border-gray-700/50">
                  <span className="text-xs font-semibold text-gray-200">
                    ASACP Member
                  </span>
                </div>
              </a>
            </div>

            <p className="text-center text-xs text-gray-500 pt-2">
              © 2024 SpicyCams. All rights reserved.
              <br />
              Protected by industry-standard safety measures and encryption.
            </p>
          </div>
        </div>
    </>
  );
}
