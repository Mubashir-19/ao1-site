const url = new URL(window.location.href);
const referralCode = url.searchParams.get("referral");

let isAuthenticated;


if (referralCode) {
  // Save referral code to localStorage
  localStorage.setItem("referralCode", referralCode);

  // Remove referral param from URL without reloading
  url.searchParams.delete("referral");
  window.history.replaceState({}, document.title, url.toString());
}

auth0
  .createAuth0Client({
    domain: "dev-h3yoa2wh4h62cg58.us.auth0.com",
    clientId: "Onsw2Vpuv8bFAsuSTI5uzt7xdlyw0bnV",
    authorizationParams: {
      redirect_uri: window.location.origin,
    },
  })
  .then(async (auth0Client) => {
    // Assumes a button with id "login" in the DOM
    const signinButton = document.getElementById("signin");

    signinButton.addEventListener("click", (e) => {
      e.preventDefault();
      auth0Client.loginWithRedirect();
    });

    if (
      location.search.includes("state=") &&
      (location.search.includes("code=") || location.search.includes("error="))
    ) {
      await auth0Client.handleRedirectCallback();
      window.history.replaceState({}, document.title, "/");
    }

    // Assumes a button with id "logout" in the DOM
    const logoutButton = document.getElementById("logout");

    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      auth0Client.logout();
    });

    
    isAuthenticated = await auth0Client.isAuthenticated();

    document.getElementById("loading").style.display = 'none';

    const userProfile = await auth0Client.getUser();

    // Assumes an element with id "profile" in the DOM
    const profileElement = document.getElementById("profile");

    if (isAuthenticated) {
      const storedCode = localStorage.getItem("referralCode");
      const inviterEmail = storedCode ? atob(storedCode).replace(/^ref_/, "") : '';

      fetch("/api/create_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userProfile.email,
          inviterEmail: inviterEmail
        }),
      });
      
      storedCode ? localStorage.removeItem("referralCode") : null;

      signinButton.style.display = "none";
      profileElement.style.display = "block";
      logoutButton.style.display = "block";
      // document.getElementById("profile-pic").src = userProfile.picture;
      // document.getElementById("profile-name").textContent =
      //   userProfile.name || userProfile.nickname || "Unknown";
      // document.getElementById("profile-email").textContent =
      //   userProfile.email || "No email";

      // Generate referral link
      const referralCode = btoa(`ref_${userProfile.email}`);
      const referralLink = `${window.location.origin}?referral=${referralCode}`;
      // const referralInput = document.getElementById("referral-link");
      // referralInput.value = referralLink;

      // Copy to clipboard on click
      document.getElementById("copy-referral").addEventListener("click", () => {
        navigator.clipboard
          .writeText(referralLink)
          .then(() => {
            alert("Referral link copied!");
          })
          .catch((err) => {
            console.error("Failed to copy:", err);
          });
      });
    } else {
      profileElement.style.display = "none";
      signinButton.style.display = "block";
      logoutButton.style.display = "none";
    }
  });
