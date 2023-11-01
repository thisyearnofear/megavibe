// UserInfoForm.tsx
import React, { useState, useEffect } from "react";

type SubmitHandler = (data: {
  name: string;
  email: string;
  link: string;
}) => void;

function UserInfoForm({
  onSubmit,
  onBack,
}: {
  onSubmit: SubmitHandler;
  onBack: () => void;
}) {
  const [name, setName] = useState(() => localStorage.getItem("name") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("email") || "");
  const [link, setLink] = useState(() => localStorage.getItem("link") || "");

  const [isValid, setIsValid] = useState({
    name: true,
    email: true,
    link: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    localStorage.setItem("name", name);
    localStorage.setItem("email", email);
    localStorage.setItem("link", link);
  }, [name, email, link]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Validate inputs
    const isNameValid = name.trim() !== "";
    const isEmailValid = email.trim() !== "" && email.includes("@");
    const isLinkValid = link.trim() !== "";

    setIsValid({
      name: isNameValid,
      email: isEmailValid,
      link: isLinkValid,
    });

    if (!isNameValid || !isEmailValid || !isLinkValid) {
      return;
    }

    setIsSubmitting(true);

    // Send a POST request to the server
    fetch("http://localhost:3000/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, link }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);

        // Reset form fields
        setName("");
        setEmail("");
        setLink("");
        setIsSubmitting(false);
        setIsSubmitted(true);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsSubmitting(false);
      });

    onSubmit({ name, email, link });
  };

  const resetForm = () => {
    if (isSubmitted) {
      setIsSubmitted(false);
      setName("");
      setEmail("");
      setLink("");
      onBack(); // Go back to role selection
    }
  };

  return (
    <form onSubmit={handleSubmit} className="UserInfoForm">
      <div className="back-button">
        <button type="button" onClick={onBack}>
          Back
        </button>
      </div>

      <div className="form-inputs">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={isValid.name ? "" : "invalid"}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={isValid.email ? "" : "invalid"}
        />
        <input
          type="text"
          placeholder="Link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className={isValid.link ? "" : "invalid"}
        />
      </div>

      <div className="submit-button">
        <button type="submit" onClick={resetForm} disabled={isSubmitting}>
          {isSubmitted
            ? "🙌 Added to Waitlist 🙌"
            : isSubmitting
            ? "Submitting..."
            : "Submit"}
        </button>
      </div>
    </form>
  );
}

export default UserInfoForm;
