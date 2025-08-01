import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

// Global Firebase config and app ID provided by the environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Custom Modal Component for alerts
const CustomModal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-8 shadow-2xl max-w-sm w-full text-center border border-green-500 transform scale-95 md:scale-100 transition-transform duration-300">
        <p className="text-xl sm:text-2xl text-white mb-6">{message}</p>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full text-lg sm:text-xl shadow-md transition-transform duration-200 transform hover:scale-105"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
};

// Main App component
const App = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  const [walletConnected, setWalletConnected] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState(null);

  // Authenticate user and set up Firestore listener
  useEffect(() => {
    const authenticateAndListen = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase authentication error:", error);
        setModalMessage(`Authentication failed: ${error.message}`);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const currentUserId = user.uid;
        setUserId(currentUserId);
        setWalletConnected(true); // Assume wallet connected on auth
        setLoading(false);
      } else {
        setUserId(null);
        setWalletConnected(false);
        setLoading(false);
      }
    });

    authenticateAndListen();

    return () => unsubscribeAuth();
  }, []); // Run once on component mount

  const handleConnectWallet = () => {
    // In a real DApp, this would trigger a MetaMask or similar wallet connection
    // For this DApp, wallet connection is tied to Firebase authentication.
    // If Firebase is authenticated, wallet is considered connected.
    setModalMessage(walletConnected ? "Wallet is already connected via Firebase authentication!" : "Connecting wallet via Firebase authentication...");
    if (!walletConnected) {
      // Re-trigger auth if not connected, in case initial attempt failed or user signed out
      signInAnonymously(auth).catch(error => {
        console.error("Failed to connect wallet:", error);
        setModalMessage(`Failed to connect wallet: ${error.message}`);
      });
    }
  };

  const renderSection = () => {
    if (loading) {
      return (
        <div className="text-center text-2xl text-gray-300 mt-20">
          Loading DApp...
        </div>
      );
    }
    return (
      <>
        {activeSection === 'introduction' && <IntroductionSection />}
        {activeSection === 'nfts' && <NFTSection />}
        {activeSection === 'nft-staking' && <NFTStakingSection userId={userId} setModalMessage={setModalMessage} />}
        {activeSection === 'edinosur' && <EDinosurSection userId={userId} setModalMessage={setModalMessage} />}
        {activeSection === 'dinosur-coin' && <DinosurCoinSection />}
        {activeSection === 'edinosur-sale' && <EDinosurSaleSection userId={userId} setModalMessage={setModalMessage} />}
        {activeSection === 'roadmap' && <RoadmapSection />}
        {activeSection === 'raffle-slot' && <RaffleSlotSection userId={userId} setModalMessage={setModalMessage} />}
        {activeSection === 'affiliate-pages' && <AffiliatePagesSection userId={userId} setModalMessage={setModalMessage} />}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#08D199] text-white font-inter flex flex-col items-center py-6 px-2 sm:py-10 sm:px-4 lg:px-8">
      <nav className="w-full max-w-7xl bg-gray-900 bg-opacity-80 rounded-full p-3 sm:p-4 mb-8 sm:mb-10 shadow-lg flex flex-wrap justify-center items-center gap-2 sm:gap-4 relative">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 flex-grow">
          <NavItem title="Intro" section="introduction" activeSection={activeSection} setActiveSection={setActiveSection} />
          <NavItem title="NFTs" section="nfts" activeSection={activeSection} setActiveSection={setActiveSection} />
          <NavItem title="Staking" section="nft-staking" activeSection={activeSection} setActiveSection={setActiveSection} />
          <NavItem title="$eDINOSUR" section="edinosur" activeSection={activeSection} setActiveSection={setActiveSection} />
          <NavItem title="$DINOSUR" section="dinosur-coin" activeSection={activeSection} setActiveSection={setActiveSection} />
          <NavItem title="Sale" section="edinosur-sale" activeSection={activeSection} setActiveSection={setActiveSection} />
          <NavItem title="Roadmap" section="roadmap" activeSection={activeSection} setActiveSection={setActiveSection} />
          <NavItem title="Raffle" section="raffle-slot" activeSection={activeSection} setActiveSection={setActiveSection} />
          <NavItem title="Affiliate" section="affiliate-pages" activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>
        <button
          className={`mt-2 sm:mt-0 ml-0 sm:ml-auto px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm sm:text-lg font-semibold transition-all duration-300 ease-in-out
            ${walletConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-md`}
          onClick={handleConnectWallet}
          disabled={loading}
        >
          {loading ? 'Connecting...' : (walletConnected ? 'Wallet Connected' : 'Connect Wallet')}
        </button>
      </nav>

      <main className="w-full max-w-7xl flex-grow">
        {renderSection()}
      </main>

      <footer className="w-full max-w-7xl text-center mt-8 p-3 text-gray-300">
        <p className="text-sm sm:text-base">&copy; 2025 Dino Fighter G1 DApp. All rights reserved.</p>
        {userId && <p className="text-xs sm:text-sm mt-1">Your User ID: {userId}</p>}
      </footer>

      <CustomModal message={modalMessage} onClose={() => setModalMessage(null)} />
    </div>
  );
};

const NavItem = ({ title, section, activeSection, setActiveSection }) => (
  <button
    className={`px-3 py-2 sm:px-6 sm:py-3 rounded-full text-sm sm:text-lg font-semibold transition-all duration-300 ease-in-out
      ${activeSection === section ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-green-500 hover:text-white'}`}
    onClick={() => setActiveSection(section)}
  >
    {title}
  </button>
);

const SectionWrapper = ({ id, title, children }) => (
  <section id={id} className="bg-gray-800 bg-opacity-70 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-10 shadow-2xl backdrop-blur-sm">
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center text-green-400 mb-6 sm:mb-8 tracking-wide leading-tight">
      {title}
    </h2>
    {children}
  </section>
);

const IntroductionSection = () => (
  <SectionWrapper id="introduction" title="Welcome to Dino Fighter G1!">
    <div className="text-center max-w-4xl mx-auto">
      <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
        Welcome to the $DINOSUR Ecosystem: Command Your Dino Fighter G1s! Prepare for a revolutionary blend of meme culture, utility, and prehistoric power! The $DINOSUR project introduces an innovative Play-to-Earn (P2E) model centered around the highly anticipated Dino Fighter G1 NFT collection. These aren't just digital collectibles; they are your key to actively mining $DINOSUR tokens, participating in exciting raffles, and shaping the future of our decentralized autonomous organization (DAO).
      </p>
      <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
        Our mission is to create a dynamic and rewarding environment where collectors can truly engage with their digital assets. By blending captivating artwork with strategic tokenomics, Dino Fighter G1 NFTs offer both aesthetic appeal and tangible utility, propelling you into an era where your digital assets actively work for you.
      </p>
      <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
        Dive into a world where your strategic decisions in staking and battling directly influence your earnings. The Dino Fighter G1 DApp is designed to be intuitive and engaging, making it easy for both seasoned crypto enthusiasts and newcomers to participate in the $DINOSUR ecosystem.
      </p>
      <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
        With a multiplayer that helps you to earn more. Common+rare gets 1.05, +unique 1.15, +king 1.3, +legend 1.5 times multiplier in total daily $eDINOSUR earning.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6 sm:mt-8">
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
          Start Your Adventure
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
          Learn More
        </button>
      </div>
      <img
        src="https://bafybeie5hsqy2nu46c4bb2hpzy7j5tuh47wz333rf3lpmp4a36modolexa.ipfs.web3approved.com/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaWQiOiJiYWZ5YmVpZTVoc3F5Mm51NDZjNGJiMmhwenk3ajV0dWg0N3d6MzMzcmYzbHBtcDRhMzZtb2RvbGV4YSIsInprb2plY3RfdXVpZCI6IjVkM2JkNWQ4LWIzNTctNDIxYS1hYThkLTA5NDEyOGU4MDg4YiIsImlhdCI6MTc1MzA0ODcxMSwic3ViIjoiSVBGUy10b2tlbiJ9.1iHg3FRfZt_HuEJOk4zqhNgePldwmUrnqJte6zGGLLA"
        alt="Epic Dino Battle"
        className="mt-8 sm:mt-10 rounded-xl shadow-xl w-full"
        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/1200x600/08D199/FFFFFF?text=Dino+Fighter+Placeholder"; }}
      />
      {/* Social Links */}
      <div className="mt-8 sm:mt-10 text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-3 sm:mb-4">Join Our Community!</h3>
        <div className="flex justify-center gap-4 sm:gap-6 text-xl sm:text-2xl">
          <a href="https://x.com/dinofighterg1" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors duration-300">
            Twitter
          </a>
          <a href="https://discord.gg/TEkjhNQ2" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-600 transition-colors duration-300">
            Discord
          </a>
          <a href="https://docs.dinofighter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors duration-300">
            Gitbook
          </a>
        </div>
      </div>
    </div>
  </SectionWrapper>
);


const NFTSection = () => (
  <SectionWrapper id="nfts" title="Dino Fighter G1 NFTs: Your Army Awaits!">
    <div className="text-center max-w-4xl mx-auto">
      <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
        The Dino Fighter G1 collection comprises a total of 2,660 unique NFTs, each meticulously designed and categorized by rarity. Your collection will form the backbone of your $eDINOSUR mining operation, with each tier offering escalating earning power.
      </p>

      <h3 className="text-3xl sm:text-4xl font-bold text-green-300 mb-4 sm:mb-6">NFT Rarity and Supply</h3>
      <ul className="text-left text-base sm:text-lg text-gray-300 space-y-2 mb-6 sm:mb-8 max-w-2xl mx-auto">
        <li><span className="font-semibold">Common Dino Fighter G1s:</span> 1,000 NFTs - The foundational units of your formidable force.</li>
        <li><span className="font-semibold">Rare Dino Fighter G1s:</span> 600 NFTs - Enhanced fighters with increased earning potential.</li>
        <li><span className="font-semibold">Unique Dino Fighter G1s:</span> 400 NFTs - Distinctive and powerful assets in your arsenal.</li>
        <li><span className="font-semibold">King Dino Fighter G1s:</span> 500 NFTs - Royal beasts offering significant boosts.</li>
        <li><span className="font-semibold">Legend Dino Fighter G1s:</span> 160 NFTs - The ultimate apex predators, highly coveted for their supreme power and exclusive multipliers.</li>
      </ul>

      <h3 className="text-3xl sm:text-4xl font-bold text-green-300 mb-4 sm:mb-6">Unprecedented Earning Power: Daily $eDINOSUR Rewards!</h3>
      <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
        Each Dino Fighter G1 NFT transforms into a dedicated mining rig when staked in our intuitive DApp. We've supercharged their earning capabilities to ensure a dynamic and rewarding experience. Here's how your daily $eDINOSUR income breaks down by rarity:
      </p>
      <ul className="text-left text-base sm:text-lg text-gray-300 space-y-2 mb-6 sm:mb-8 max-w-2xl mx-auto">
        <li><span className="font-semibold">Common Dino Fighter G1:</span> Generates a robust 5,000 $eDINOSUR daily.</li>
        <li><span className="font-semibold">Rare Dino Fighter G1:</span> Boosts your earnings to 10,000 $eDINOSUR daily.</li>
        <li><span className="font-semibold">Unique Dino Fighter G1:</span> Delivers a formidable 15,000 $eDINOSUR every day.</li>
        <li><span className="font-semibold">King Dino Fighter G1 (Water, Ice, Fire):</span> These majestic rulers command 25,000 $eDINOSUR daily.</li>
        <li><span className="font-semibold">Legend Dino Fighter G1:</span> The pinnacle of power, yielding an astounding 50,000 $eDINOSUR daily!</li>
      </ul>

      <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
        With a multiplayer that helps you to earn more. Common+rare gets 1.05, +unique 1.15, +king 1.3, +legend 1.5 times multiplier in total daily $eDINOSUR earning.
      </p>

      <h3 className="text-3xl sm:text-4xl font-bold text-green-300 mb-4 sm:mb-6">NFT Allocation Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-gray-700 rounded-xl p-5 sm:p-6 shadow-lg">
          <h4 className="text-2xl sm:text-3xl font-bold text-green-300 mb-3 sm:mb-4">Common, Rare, Unique NFTs</h4>
          <ul className="text-left text-base sm:text-lg text-gray-300 space-y-2">
            <li><span className="font-semibold">Genesis Sale:</span> 40%</li>
            <li><span className="font-semibold">Team:</span> 10%</li>
            <li><span className="font-semibold">Raffle Slot:</span> 50%</li>
          </ul>
        </div>
        <div className="bg-gray-700 rounded-xl p-5 sm:p-6 shadow-lg">
          <h4 className="text-2xl sm:text-3xl font-bold text-green-300 mb-3 sm:mb-4">King and Legend NFTs</h4>
          <ul className="text-left text-base sm:text-lg text-gray-300 space-y-2">
            <li><span className="font-semibold">Raffle Slot:</span> 50% (can be won only in raffle slot for 6 months)</li>
            <li><span className="font-semibold">Airdrop:</span> 20%</li>
            <li><span className="font-semibold">DAO:</span> 20%</li>
            <li><span className="font-semibold">Team:</span> 10%</li>
          </ul>
        </div>
      </div>
      <img
        src="https://bafybeids4tlguc36izjhozrhxxecxcavpvxxcm3egqmlglsjibgsdscvby.ipfs.web3approved.com/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaWQiOiJiYWZ5YmVpZHM0dGxndWMzNml6amhvenJoeHhlY3hjYXZwdnh4Y20zZWdxbWxnbHNqaWJnc2RzY3ZieSIsInByb2plY3RfdXVpZCI6IjVkM2JkNWQ4LWIzNTctNDIxYS1hYThkLTA5NDEyOGU4MDg4YiIsImlhdCI6MTc1MzA1MTAwMywic3ViIjoiSVBGUy10b2tlbiJ9.yUmrL0TIUMHGajCojA5xV-pTx_ISKqcgXS91vTLk76I"
        alt="Dino NFT Collection"
        className="mt-8 sm:mt-10 rounded-xl shadow-xl w-full"
        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/1200x600/08D199/FFFFFF?text=Dino+NFT+Placeholder"; }}
      />
    </div>
  </SectionWrapper>
);


const NFTStakingSection = ({ userId, setModalMessage }) => {
  const [stakedNFTs, setStakedNFTs] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0); // This now represents $eDINOSUR
  const [loadingNFTs, setLoadingNFTs] = useState(true);

  // Updated base cost for adding a slot
  const BASE_ADD_SLOT_EDINOSUR_COST = 200000;
  const ADD_SLOT_BURN_AMOUNT_PERCENTAGE = 0.5; // 50% of the calculated cost

  // Firestore path for user's staked NFTs and earnings
  const userStakingDocRef = userId ? doc(db, `artifacts/${appId}/users/${userId}/data/staking`) : null;

  // Function to get frame color based on NFT type
  const getFrameColorClass = (type) => {
    switch (type) {
      case 'Common':
        return 'border-[#16797c]';
      case 'Rare':
        return 'border-[#E73E4E]';
      case 'Unique':
      case 'King':
      case 'Legend':
        return 'border-[#FA5C51]';
      default:
        return 'border-gray-600'; // Default for new slots or unknown types
    }
  };

  // Function to calculate the multiplier based on staked NFT types
  const calculateMultiplier = (nfts) => {
    let multiplier = 1.0;
    const stakedTypes = new Set(nfts.filter(nft => nft.staked).map(nft => nft.type));

    if (stakedTypes.has('Legend')) {
      multiplier = 1.5;
    } else if (stakedTypes.has('King')) {
      multiplier = 1.3;
    } else if (stakedTypes.has('Unique')) {
      multiplier = 1.15;
    } else if (stakedTypes.has('Common') || stakedTypes.has('Rare')) {
      multiplier = 1.05;
    }
    return multiplier;
  };

  // Calculate dynamic cost for adding a new slot
  const calculateAddSlotCost = (currentSlotCount) => {
    let baseCost = BASE_ADD_SLOT_EDINOSUR_COST;
    if (currentSlotCount >= 4) {
      const multiplier = Math.pow(1.5, currentSlotCount - 3); // 50% increase for each slot after the 4th
      return baseCost * multiplier;
    }
    return baseCost;
  };

  // Load initial data and set up real-time listener
  useEffect(() => {
    if (!userId || !userStakingDocRef) {
      setLoadingNFTs(false);
      return;
    }

    const unsubscribe = onSnapshot(userStakingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStakedNFTs(data.nfts || []);
        setTotalEarned(data.earned || 0);
      } else {
        // Initialize with 3 default NFTs if document doesn't exist
        setStakedNFTs([
          { id: 1, type: 'Common', earning: 5000, staked: false, lastStakedTime: 0 },
          { id: 2, type: 'Rare', earning: 10000, staked: false, lastStakedTime: 0 },
          { id: 3, type: 'Unique', earning: 15000, staked: false, lastStakedTime: 0 },
        ]);
        setTotalEarned(0);
      }
      setLoadingNFTs(false);
    }, (error) => {
      console.error("Error fetching NFT staking data:", error);
      setModalMessage(`Error loading staking data: ${error.message}`);
      setLoadingNFTs(false);
    });

    return () => unsubscribe();
  }, [userId, userStakingDocRef, setModalMessage]);

  // Simulate earning over time (client-client)
  useEffect(() => {
    if (!userId || loadingNFTs) return;

    const interval = setInterval(() => {
      let baseDailyEarnings = 0;
      const currentlyStakedNFTs = stakedNFTs.filter(nft => nft.staked);
      currentlyStakedNFTs.forEach(nft => {
        baseDailyEarnings += nft.earning;
      });

      const currentMultiplier = calculateMultiplier(stakedNFTs);
      const actualDailyEarnings = baseDailyEarnings * currentMultiplier;

      setTotalEarned(prev => prev + actualDailyEarnings / (24 * 60 * 60)); // Simulate per second earning
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [userId, loadingNFTs, stakedNFTs]); // Depend on stakedNFTs to recalculate multiplier

  const updateFirestoreStaking = async (updatedNFTs, updatedEarned, updatedReadyToBurnEDinosur) => {
    if (!userStakingDocRef) {
      setModalMessage("Please connect your wallet to save staking data.");
      return;
    }
    try {
      await setDoc(userStakingDocRef, {
        nfts: updatedNFTs,
        earned: updatedEarned,
        readyToBurnEDinosur: updatedReadyToBurnEDinosur // Ensure this is updated
      }, { merge: true });
    } catch (error) {
      console.error("Error updating staking data:", error);
      setModalMessage(`Failed to update staking data: ${error.message}`);
    }
  };

  const handleStakeNFT = (id) => {
    const updatedNFTs = stakedNFTs.map(nft =>
      nft.id === id ? { ...nft, staked: true, lastStakedTime: Date.now() } : nft
    );
    setStakedNFTs(updatedNFTs);
    updateFirestoreStaking(updatedNFTs, totalEarned, stakedNFTs.readyToBurnEDinosur); // Pass current readyToBurnEDinosur
    setModalMessage(`NFT #${id} staked successfully!`);
  };

  const handleUnstakeNFT = (id) => {
    const updatedNFTs = stakedNFTs.map(nft =>
      nft.id === id ? { ...nft, staked: false, lastStakedTime: 0 } : nft
    );
    setStakedNFTs(updatedNFTs);
    updateFirestoreStaking(updatedNFTs, totalEarned, stakedNFTs.readyToBurnEDinosur); // Pass current readyToBurnEDinosur
    setModalMessage(`NFT #${id} unstaked.`);
  };

  const handleClaimReward = () => {
    if (totalEarned > 0) {
      setModalMessage(`Claimed ${totalEarned.toFixed(2)} $eDINOSUR!`);
      setTotalEarned(0); // Reset after claiming
      updateFirestoreStaking(stakedNFTs, 0, stakedNFTs.readyToBurnEDinosur); // Pass current readyToBurnEDinosur
    } else {
      setModalMessage("No $eDINOSUR to claim yet!");
    }
  };

  const handleAddSlot = async () => {
    if (!userId || !userStakingDocRef) {
      setModalMessage("Please connect your wallet to add a slot.");
      return;
    }

    try {
      const docSnap = await getDoc(userStakingDocRef);
      let currentData = docSnap.exists() ? docSnap.data() : { earned: 0, readyToBurnEDinosur: 0, nfts: [] };
      let currentEDinosurBalance = currentData.earned || 0;
      let currentReadyToBurnEDinosur = currentData.readyToBurnEDinosur || 0;
      let currentNFTs = currentData.nfts || [];

      const calculatedCost = calculateAddSlotCost(currentNFTs.length);

      // Logic for eDINOSUR purchase
      if (currentEDinosurBalance >= calculatedCost) {
        const remainingEDinosur = currentEDinosurBalance - calculatedCost;
        const burnAmount = calculatedCost * ADD_SLOT_BURN_AMOUNT_PERCENTAGE; // 50% of the calculated cost
        const daoAmount = calculatedCost - burnAmount; // Remaining 50% to DAO
        const newReadyToBurnEDinosur = currentReadyToBurnEDinosur + burnAmount;

        const newId = currentNFTs.length > 0 ? Math.max(...currentNFTs.map(n => n.id)) + 1 : 1;
        const newNFT = { id: newId, type: 'New Slot', earning: 0, staked: false, lastStakedTime: 0 };
        const updatedNFTs = [...currentNFTs, newNFT];

        setModalMessage(`You are about to buy a slot for ${calculatedCost.toFixed(0)} $eDINOSUR. ${burnAmount.toFixed(0)} $eDINOSUR will be burnt, and ${daoAmount.toFixed(0)} $eDINOSUR will go to DAO.`);
        setStakedNFTs(updatedNFTs);
        await updateFirestoreStaking(updatedNFTs, remainingEDinosur, newReadyToBurnEDinosur);
      } else {
        setModalMessage(`Insufficient $eDINOSUR. You need ${calculatedCost.toFixed(2)} $eDINOSUR but have ${currentEDinosurBalance.toFixed(2)}.`);
      }
    } catch (error) {
      console.error("Error adding slot:", error);
      setModalMessage(`Failed to add slot: ${error.message}`);
    }
  };

  const currentSlotCount = stakedNFTs.length;
  const currentEDinosurSlotCost = calculateAddSlotCost(currentSlotCount);

  if (loadingNFTs) {
    return (
      <SectionWrapper id="nft-staking" title="NFT Staking: Grow Your Roar!">
        <div className="text-center text-2xl text-gray-300 mt-10">Loading your NFTs...</div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="nft-staking" title="NFT Staking: Grow Your Roar!">
      <div className="text-center max-w-4xl mx-auto">
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          Unleash the prehistoric power of your Dino Fighter G1 NFTs and start earning daily $eDINOSUR tokens!
          Staking your NFTs is a core mechanic of the Dino Fighter G1 ecosystem, allowing you to passively earn rewards and contribute to the network's stability.
        </p>

        {/* Added text */}
        <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
          When you acquire new staking slots, 50% of the $eDINOSUR or $DINOSUR token used for the purchase will be permanently burnt, reducing the total supply and increasing scarcity. The remaining 50% will be allocated to the DAO treasury, funding future development, community initiatives, and ecosystem growth.
        </p>

        <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Your Staking Slots</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stakedNFTs.map((nft) => (
            <div key={nft.id} className={`bg-gray-700 rounded-xl p-4 shadow-lg flex flex-col items-center justify-between min-h-[180px] sm:min-h-[200px] border-4 ${getFrameColorClass(nft.type)}`}>
              <img
                src={`https://placehold.co/120x120/08D199/FFFFFF?text=${nft.type}+NFT`}
                alt={`${nft.type} NFT`}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mb-2 sm:mb-3"
                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/120x120/08D199/FFFFFF?text=NFT"; }}
              />
              <h4 className="text-lg sm:text-xl font-bold text-green-300 mb-1">{nft.type} NFT #{nft.id}</h4>
              <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3">{nft.staked ? 'Staked' : 'Unstaked'}</p>
              {nft.staked ? (
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full text-sm shadow-md"
                  onClick={() => handleUnstakeNFT(nft.id)}
                >
                  Unstake
                </button>
              ) : (
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm shadow-md"
                  onClick={() => handleStakeNFT(nft.id)}
                >
                  Stake NFT
                </button>
              )}
            </div>
          ))}
          <div className="bg-gray-700 rounded-xl p-4 shadow-lg flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] border-4 border-gray-600">
            <h4 className="text-xl font-bold text-green-300 mb-4">Add New Slot</h4>
            <div className="flex justify-center items-center gap-4 mb-4">
              <label className="flex items-center text-base sm:text-lg text-gray-300 cursor-pointer">
                <span className="ml-2">{currentEDinosurSlotCost.toFixed(0)} $eDINOSUR</span>
              </label>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full text-base sm:text-lg shadow-lg"
              onClick={handleAddSlot}
            >
              Buy Slot
            </button>
          </div>
        </div>

        <div className="bg-gray-700 rounded-xl p-6 shadow-lg mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Earning Monitor</h3>
          <div className="bg-gray-900 border-4 border-yellow-500 rounded-lg p-4 mb-4 shadow-inner">
            <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400 font-mono tracking-wider text-center">
              {totalEarned.toFixed(2)} <span className="text-2xl sm:text-3xl">$eDINOSUR</span>
            </p>
          </div>
          <p className="text-base sm:text-lg text-gray-300 mb-4">Current Multiplier: <span className="font-mono">{calculateMultiplier(stakedNFTs).toFixed(2)}x</span></p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-base sm:text-lg shadow-md"
              onClick={handleClaimReward}
            >
              Claim Reward
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-base sm:text-lg shadow-md"
              onClick={() => setModalMessage("Unstake all NFTs functionality would go here.")}
            >
              Unstake All
            </button>
          </div>
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">NFT Earning Details</h3>
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          Here's how your daily $eDINOSUR income breaks down by rarity when you stake your Dino Fighter G1 NFTs:
        </p>
        <ul className="text-left text-base sm:text-lg text-gray-300 space-y-2 mb-6 sm:mb-8 max-w-2xl mx-auto">
          <li><span className="font-semibold">Common Dino Fighter G1:</span> Generates a robust 5,000 $eDINOSUR daily.</li>
          <li><span className="font-semibold">Rare Dino Fighter G1:</span> Boosts your earnings to 10,000 $eDINOSUR daily.</li>
          <li><span className="font-semibold">Unique Dino Fighter G1:</span> Delivers a formidable 15,000 $eDINOSUR every day.</li>
          <li><span className="font-semibold">King Dino Fighter G1 (Water, Ice, Fire):</span> These majestic rulers command 25,000 $eDINOSUR daily.</li>
          <li><span className="font-semibold">Legend Dino Fighter G1:</span> The pinnacle of power, yielding an astounding 50,000 $eDINOSUR daily!</li>
        </ul>
        <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
          With a multiplayer that helps you to earn more. Common+rare gets 1.05, +unique 1.15, +king 1.3, +legend 1.5 times multiplier in total daily $eDINOSUR earning.
        </p>
      </div>
    </SectionWrapper>
  );
};

// New $eDINOSUR Section Component
const EDinosurSection = ({ userId, setModalMessage }) => {
  const [eDinosurBalance, setEDinosurBalance] = useState(0);
  const [readyToBurnEDinosur, setReadyToBurnEDinosur] = useState(0);
  const [totalBurntEDinosur, setTotalBurntEDinosur] = useState(0);
  const [loadingEDinosur, setLoadingEDinosur] = useState(true);

  // Firestore path for user's staked NFTs and earnings (which is now eDINOSUR)
  const userStakingDocRef = userId ? doc(db, `artifacts/${appId}/users/${userId}/data/staking`) : null;

  useEffect(() => {
    if (!userId || !userStakingDocRef) {
      setLoadingEDinosur(false);
      return;
    }

    const unsubscribe = onSnapshot(userStakingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEDinosurBalance(data.earned || 0); // eDINOSUR balance is the earned amount from staking
        setReadyToBurnEDinosur(data.readyToBurnEDinosur || 0);
        setTotalBurntEDinosur(data.totalBurntEDinosur || 0);
      } else {
        setEDinosurBalance(0);
        setReadyToBurnEDinosur(0);
        setTotalBurntEDinosur(0);
        // Initialize if document doesn't exist
        setDoc(userStakingDocRef, { earned: 0, readyToBurnEDinosur: 0, totalBurntEDinosur: 0 }, { merge: true }).catch(e => console.error("Error initializing eDINOSUR data:", e));
      }
      setLoadingEDinosur(false);
    }, (error) => {
      console.error("Error fetching $eDINOSUR data:", error);
      setModalMessage(`Error loading $eDINOSUR data: ${error.message}`);
      setLoadingEDinosur(false);
    });

    return () => unsubscribe();
  }, [userId, userStakingDocRef, setModalMessage]);

  const handleClaimDinosur = async () => {
    if (eDinosurBalance > 0) {
      setModalMessage(`Congratulations! You have claimed ${eDinosurBalance.toFixed(2)} $DINOSUR (1:1 from $eDINOSUR). This will be available at TGE.`);
      // In a real DApp, this would trigger a claim transaction on the blockchain
      // For simulation, we'll just reset the eDINOSUR balance after "claiming"
      try {
        await updateDoc(userStakingDocRef, { earned: 0 });
      } catch (error) {
        console.error("Error resetting eDINOSUR after claim:", error);
        setModalMessage(`Failed to reset $eDINOSUR balance: ${error.message}`);
      }
    } else {
      setModalMessage("You have no $eDINOSUR to claim yet!");
    }
  };

  const handleBurnEDinosur = async () => {
    if (readyToBurnEDinosur > 0) {
      try {
        const newTotalBurnt = totalBurntEDinosur + readyToBurnEDinosur;
        await updateDoc(userStakingDocRef, {
          readyToBurnEDinosur: 0,
          totalBurntEDinosur: newTotalBurnt
        });
        setModalMessage(`Successfully burnt ${readyToBurnEDinosur.toFixed(2)} $eDINOSUR! Total burnt: ${newTotalBurnt.toFixed(2)} $eDINOSUR.`);
      } catch (error) {
        console.error("Error burning $eDINOSUR:", error);
        setModalMessage(`Failed to burn $eDINOSUR: ${error.message}`);
      }
    } else {
      setModalMessage("No $eDINOSUR ready to burn!");
    }
  };

  if (loadingEDinosur) {
    return (
      <SectionWrapper id="edinosur" title="Your $eDINOSUR Rewards">
        <div className="text-center text-2xl text-gray-300 mt-10">Loading your $eDINOSur balance...</div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="edinosur" title="Your $eDINOSUR Rewards">
      <div className="text-center max-w-4xl mx-auto">
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          $eDINOSUR is your early NFT staking reward, designed to accumulate value before the official Token Generation Event (TGE) of $DINOSUR. It serves as a crucial bridge, allowing you to earn tangible rewards from your staked Dino Fighter G1 NFTs even before the main $DINOSUR token is fully launched and tradable.
        </p>
        <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
          At TGE, you will be able to claim your accumulated $eDINOSUR for $DINOSUR at a 1:1 ratio! This ensures that your early contributions and efforts in staking are fully recognized and rewarded with the primary ecosystem token.
        </p>

        <div className="bg-gray-700 rounded-xl p-6 shadow-lg mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Total Claimable $DINOSUR at TGE</h3>
          <div className="bg-gray-900 border-4 border-yellow-500 rounded-lg p-4 mb-4 shadow-inner">
            <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400 font-mono tracking-wider text-center">
              {eDinosurBalance.toFixed(2)} <span className="text-2xl sm:text-3xl">$eDINOSUR</span>
            </p>
          </div>
          <p className="text-base sm:text-lg text-gray-300 mb-4">This balance represents your future $DINOSUR claim, ensuring your early earnings translate directly into the main token.</p>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-base sm:text-lg shadow-md"
            onClick={handleClaimDinosur}
          >
            Claim $DINOSUR at TGE
          </button>
        </div>

        {/* eDINOSUR Burn Monitors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-10">
          <div className="bg-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Ready to Burn $eDINOSUR</h3>
            <div className="bg-gray-900 border-4 border-red-500 rounded-lg p-4 mb-4 shadow-inner">
              <p className="text-4xl sm:text-5xl font-extrabold text-red-400 font-mono tracking-wider text-center">
                {readyToBurnEDinosur.toFixed(2)} <span className="text-2xl sm:text-3xl">$eDINOSUR</span>
              </p>
            </div>
            <p className="text-base sm:text-lg text-gray-300 mb-2">This amount is designated for burning, contributing to the token's deflationary mechanism.</p>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-base sm:text-lg shadow-md"
              onClick={handleBurnEDinosur}
            >
              Burn $eDINOSUR Now
            </button>
          </div>
          <div className="bg-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Total Burnt $eDINOSUR</h3>
            <div className="bg-gray-900 border-4 border-red-500 rounded-lg p-4 mb-4 shadow-inner">
              <p className="text-4xl sm:text-5xl font-extrabold text-red-400 font-mono tracking-wider text-center">
                {totalBurntEDinosur.toFixed(2)} <span className="text-2xl sm:text-3xl">$eDINOSUR</span>
              </p>
            </div>
            <p className="text-base sm:text-lg text-gray-300 mt-2">Permanently removed from circulation, enhancing the value of remaining tokens.</p>
          </div>
        </div>


        <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4 mt-8 sm:mt-10">How to Earn $eDINOSUR</h3>
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          Continue staking your Dino Fighter G1 NFTs in the NFT Staking section to earn more $eDINOSUR daily. The more powerful your staked NFTs and the higher your multiplier, the more $eDINOSUR you will accumulate! Your active participation directly fuels your earning potential.
        </p>

        <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Use $eDINOSUR in Raffle Slot</h3>
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          Beyond claiming $DINOSUR at TGE, your accumulated $eDINOSUR has immediate utility! You can use it to purchase tickets in the Raffle Slot and win exciting prizes, including more NFTs, USDT, and more $eDINOSUR, even before TGE! This provides immediate utility for your early rewards and adds an extra layer of engagement.
        </p>
      </div>
    </SectionWrapper>
  );
};

const DinosurCoinSection = () => {
  const [readyToBurnDinosur, setReadyToBurnDinosur] = useState(0);
  const [totalBurntDinosur, setTotalBurntDinosur] = useState(0);
  const [loadingBurnStats, setLoadingBurnStats] = useState(true);

  // Firestore path for global DINOSUR burn stats
  const dinosurBurnStatsDocRef = doc(db, `artifacts/${appId}/public/data/dinosur_burn_stats/global_stats`);

  useEffect(() => {
    const unsubscribe = onSnapshot(dinosurBurnStatsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setReadyToBurnDinosur(data.readyToBurnDinosur || 0);
        setTotalBurntDinosur(data.totalBurntDinosur || 0);
      } else {
        setReadyToBurnDinosur(0);
        setTotalBurntDinosur(0);
        // Initialize if document doesn't exist
        setDoc(dinosurBurnStatsDocRef, { readyToBurnDinosur: 0, totalBurntDinosur: 0 }, { merge: true }).catch(e => console.error("Error initializing DINOSUR burn data:", e));
      }
      setLoadingBurnStats(false);
    }, (error) => {
      console.error("Error fetching DINOSUR burn data:", error);
      setLoadingBurnStats(false);
    });

    return () => unsubscribe();
  }, [dinosurBurnStatsDocRef]);

  const handleBurnDinosur = async () => {
    if (readyToBurnDinosur > 0) {
      try {
        const newTotalBurnt = totalBurntDinosur + readyToBurnDinosur;
        await updateDoc(dinosurBurnStatsDocRef, {
          readyToBurnDinosur: 0,
          totalBurntDinosur: newTotalBurnt
        });
        // This modal message would typically be handled by a global modal, but for simplicity here
        alert(`Successfully burnt ${readyToBurnDinosur.toFixed(2)} $DINOSUR! Total burnt: ${newTotalBurnt.toFixed(2)} $DINOSUR.`);
      } catch (error) {
        console.error("Error burning $DINOSUR:", error);
        alert(`Failed to burn $DINOSUR: ${error.message}`);
      }
    } else {
      alert("No $DINOSUR ready to burn!");
    }
  };

  if (loadingBurnStats) {
    return (
      <SectionWrapper id="dinosur-coin" title="$DINOSUR: The Roaring Meme Coin">
        <div className="text-center text-2xl text-gray-300 mt-10">Loading $DINOSUR burn stats...</div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="dinosur-coin" title="$DINOSUR: The Roaring Meme Coin">
      <div className="text-center max-w-4xl mx-auto">
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          $DINOSUR token is designed with a robust and transparent tokenomics model to ensure long-term sustainability, incentivize community participation, and power the entire Dino Fighter G1 ecosystem. It serves as the primary utility and governance token, allowing holders to participate in DAO decisions and access exclusive features.
        </p>
        <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
          $DINOSUR is a truly <span className="text-green-300">Community-Driven</span> meme coin. Its future development, key decisions, and strategic direction will be shaped by the collective voice of its holders through decentralized autonomous organization (DAO) governance. This ensures that the project evolves in line with the community's vision and interests.
        </p>
        <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
          Furthermore, $DINOSUR is built with <span className="text-green-300">Multichain</span> compatibility in mind. Our vision includes expanding across various blockchain networks, enabling seamless interoperability and broader accessibility for users. This strategic approach will enhance liquidity, reduce transaction costs, and allow $DINOSUR to thrive in a diverse Web3 landscape, connecting more communities and expanding its utility.
        </p>
        <div className="bg-gray-700 rounded-xl p-6 sm:p-8 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Tokenomics</h3>
            <p className="text-base sm:text-lg text-gray-300 mb-4">
              Our tokenomics model is carefully balanced to support both short-term incentives and long-term growth. With a fixed total supply, $DINOSUR is designed to become a valuable asset within the Web3 gaming space.
            </p>
            <ul className="text-left text-base sm:text-lg text-gray-300 space-y-2">
              <li><span className="font-semibold">Total Supply:</span> 500 Billion $DINOSUR</li>
              <li><span className="font-semibold">NFT Mining:</span> 50% - Allocated for P2E rewards, ensuring continuous engagement.</li>
              <li><span className="font-semibold">Raffle Slot:</span> 5% - Fuels the exciting raffle system, offering unique winning opportunities.</li>
              <li><span className="font-semibold">DAO:</span> 5% - Empowers community governance, giving token holders a voice.</li>
              <li><span className="font-semibold">Public Sale:</span> 1% - Provides initial liquidity and broad distribution. (Updated from 2%)</li>
              <li><span className="font-semibold">Marketing:</span> 5% - Dedicated to expanding our reach and attracting new users.</li>
              <li><span className="font-semibold">Team:</span> 5% - Vested over time to align team incentives with project success.</li>
              <li><span className="font-semibold">Airdrop:</span> 5% - Rewards early supporters and key community members.</li>
              <li><span className="font-semibold">Community:</span> 10% - For future community initiatives, events, and partnerships.</li>
              <li><span className="font-semibold">Liquidity:</span> 14% - Ensures healthy trading markets and stability. (Updated from 13%)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Emission Schedule</h3>
            <p className="text-base sm:text-lg text-gray-300 mb-4">
              The emission schedule is strategically planned to ensure a steady supply of tokens while preventing market saturation, fostering sustainable growth and value appreciation.
            </p>
            <ul className="list-disc list-inside text-base sm:text-lg text-gray-300 space-y-2">
              <li><span className="font-semibold">NFT Mining:</span> 10% released at TGE, the remainder will be released according to ecosystem needs and community proposals.</li>
              <li><span className="font-semibold">Raffle Slot:</span> 10% at TGE, with the rest linearly vested over 36 months to support ongoing raffles.</li>
              <li><span className="font-semibold">DAO:</span> 10% at TGE, with the remainder vesting over 36 months, empowering long-term governance.</li>
              <li><span className="font-semibold">Public Sale:</span> 30% unlocked at TGE, with the remaining 70% vesting over 6 months to ensure price stability.</li>
              <li><span className="font-semibold">Marketing:</span> 10% at TGE, with the rest vested over 36 months to support continuous marketing efforts.</li>
              <li><span className="font-semibold">Team:</span> Subject to a six-month cliff, then linear vesting over 36 months to ensure long-term commitment.</li>
              <li><span className="font-semibold">Airdrop:</span> 20% distributed to affiliates and 20% to King and Legend NFT holders at TGE, with the rest reserved for a second airdrop decided by DAO voting.</li>
              <li><span className="font-semibold">Community:</span> 10% at TGE, with the remainder vesting for 36 months to fund community-driven initiatives.</li>
              <li><span className="font-semibold">Liquidity:</span> 50% provided at TGE to ensure robust trading, with the rest decided by future DAO voting.</li>
            </ul>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-full text-base sm:text-lg shadow-md mt-6">
              Buy $DINOSUR Now
            </button>
          </div>
        </div>

        {/* DINOSUR Burn Monitors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-10">
          <div className="bg-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Ready to Burn $DINOSUR (Global)</h3>
            <div className="bg-gray-900 border-4 border-red-500 rounded-lg p-4 mb-4 shadow-inner">
              <p className="text-4xl sm:text-5xl font-extrabold text-red-400 font-mono tracking-wider text-center">
                {readyToBurnDinosur.toFixed(2)} <span className="text-2xl sm:text-3xl">$DINOSUR</span>
              </p>
            </div>
            <p className="text-base sm:text-lg text-gray-300 mb-2">This is the total amount of $DINOSUR currently queued for burning across the entire ecosystem, reflecting community and DApp activities.</p>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full text-base sm:text-lg shadow-md"
              onClick={handleBurnDinosur}
            >
              Burn $DINOSUR Now
            </button>
          </div>
          <div className="bg-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Total Burnt $DINOSUR (Global)</h3>
            <div className="bg-gray-900 border-4 border-red-500 rounded-lg p-4 mb-4 shadow-inner">
              <p className="text-4xl sm:text-5xl font-extrabold text-red-400 font-mono tracking-wider text-center">
                {totalBurntDinosur.toFixed(2)} <span className="text-2xl sm:text-3xl">$DINOSUR</span>
              </p>
            </div>
            <p className="text-base sm:text-lg text-gray-300 mt-2">Permanently removed from circulation, enhancing the value of remaining tokens.</p>
          </div>
        </div>

      </div>
    </SectionWrapper>
  );
};

const EDinosurSaleSection = ({ userId, setModalMessage }) => {
  const totalSupply = 500_000_000_000; // 500 Billion $DINOSUR
  const saleAllocationPercentage = 0.01; // 1% of total supply
  const saleTotalTokens = totalSupply * saleAllocationPercentage; // 5 Billion $eDINOSUR
  const epochDurationDays = 7;
  const initialPrice = 0.00005; // $ per $eDINOSUR
  const priceIncreaseFactor = 1.10; // 10% increase per epoch

  // New sale limits
  const MAX_EPOCH_ALLOCATION_PERCENTAGE = 0.05; // 5% of saleTotalTokens per epoch
  const MAX_EPOCH_PURCHASE_USD = 250; // $250 max purchase per wallet per epoch

  // Sale starts 45 days from current time (simulated)
  const saleStartTimeRef = useRef(null);

  const getSaleStartDate = () => {
    const now = new Date();
    const saleStartDate = new Date(now.getTime() + (45 * 24 * 60 * 60 * 1000));
    return saleStartDate;
  };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [saleStarted, setSaleStarted] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [totalPriceUSD, setTotalPriceUSD] = useState(0);
  const [userPurchasedUSD, setUserPurchasedUSD] = useState(0); // Lifetime total
  const [userPurchasedUSDInCurrentEpoch, setUserPurchasedUSDInCurrentEpoch] = useState(0); // Per epoch
  const [lastPurchaseEpoch, setLastPurchaseEpoch] = useState(-1); // To track epoch changes
  const [loadingPurchaseData, setLoadingPurchaseData] = useState(true);

  const userSalePurchaseDocRef = userId ? doc(db, `artifacts/${appId}/users/${userId}/data/eDinoSalePurchases`) : null;

  // Load user's purchased amount from Firestore
  useEffect(() => {
    if (!userId || !userSalePurchaseDocRef) {
      setLoadingPurchaseData(false);
      return;
    }

    const unsubscribe = onSnapshot(userSalePurchaseDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserPurchasedUSD(data.totalPurchasedUSD || 0);
        setUserPurchasedUSDInCurrentEpoch(data.userPurchasedUSDInCurrentEpoch || 0);
        setLastPurchaseEpoch(data.lastPurchaseEpoch !== undefined ? data.lastPurchaseEpoch : -1);
      } else {
        setUserPurchasedUSD(0);
        setUserPurchasedUSDInCurrentEpoch(0);
        setLastPurchaseEpoch(-1);
        // Initialize if document doesn't exist
        setDoc(userSalePurchaseDocRef, { totalPurchasedUSD: 0, userPurchasedUSDInCurrentEpoch: 0, lastPurchaseEpoch: -1 }, { merge: true }).catch(e => console.error("Error initializing eDinoSalePurchases data:", e));
      }
      setLoadingPurchaseData(false);
    }, (error) => {
      console.error("Error fetching eDinoSalePurchases data:", error);
      setModalMessage(`Error loading purchase data: ${error.message}`);
      setLoadingPurchaseData(false);
    });

    return () => unsubscribe();
  }, [userId, userSalePurchaseDocRef, setModalMessage]);


  // Countdown and epoch calculation
  useEffect(() => {
    if (!saleStartTimeRef.current) {
      saleStartTimeRef.current = getSaleStartDate();
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const saleStartTime = saleStartTimeRef.current.getTime();
      const distance = saleStartTime - now;

      if (distance < 0) {
        setSaleStarted(true);
        const elapsedMs = now - saleStartTime;
        const epochMs = epochDurationDays * 24 * 60 * 60 * 1000;
        const currentEpochNum = Math.floor(elapsedMs / epochMs);
        setCurrentEpoch(currentEpochNum);
        setCurrentPrice(initialPrice * Math.pow(priceIncreaseFactor, currentEpochNum));

        // Check if epoch has changed to reset per-epoch purchase
        if (currentEpochNum !== lastPurchaseEpoch) {
          setUserPurchasedUSDInCurrentEpoch(0);
          if (userSalePurchaseDocRef) {
            updateDoc(userSalePurchaseDocRef, { userPurchasedUSDInCurrentEpoch: 0, lastPurchaseEpoch: currentEpochNum }).catch(e => console.error("Error resetting epoch purchase:", e));
          }
        }

        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setSaleStarted(false);
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastPurchaseEpoch, epochDurationDays, initialPrice, priceIncreaseFactor, userSalePurchaseDocRef]); // Added dependencies

  // Calculate total price based on buy amount and current price
  useEffect(() => {
    const amount = parseFloat(buyAmount);
    if (!isNaN(amount) && amount >= 0) {
      setTotalPriceUSD(amount * currentPrice);
    } else {
      setTotalPriceUSD(0);
    }
  }, [buyAmount, currentPrice]);

  const handleBuy = async () => {
    if (!userId || !userSalePurchaseDocRef) {
      setModalMessage("Please connect your wallet to buy $eDINOSUR.");
      return;
    }

    if (!saleStarted) {
      setModalMessage("The $eDINOSUR sale has not started yet!");
      return;
    }

    const amountToBuy = parseFloat(buyAmount);
    if (isNaN(amountToBuy) || amountToBuy <= 0) {
      setModalMessage("Please enter a valid amount to buy.");
      return;
    }

    const costUSD = amountToBuy * currentPrice;

    if (userPurchasedUSD + costUSD > 1000) { // Overall wallet limit
      setModalMessage(`You can only buy a maximum of $1000 worth of $eDINOSUR per wallet. You have already purchased $${userPurchasedUSD.toFixed(2)} and this purchase would exceed the limit.`);
      return;
    }

    if (userPurchasedUSDInCurrentEpoch + costUSD > MAX_EPOCH_PURCHASE_USD) { // Per epoch limit
      setModalMessage(`You can only buy a maximum of $${MAX_EPOCH_PURCHASE_USD} worth of $eDINOSUR per epoch. You have already purchased $${userPurchasedUSDInCurrentEpoch.toFixed(2)} in this epoch and this purchase would exceed the limit.`);
      return;
    }

    // Simulate blockchain transaction
    setModalMessage(`Simulating purchase of ${amountToBuy.toFixed(0)} $eDINOSUR for $${costUSD.toFixed(2)} USD. This would typically involve a blockchain transaction.`);

    try {
      const newTotalPurchasedUSD = userPurchasedUSD + costUSD;
      const newPurchasedUSDInCurrentEpoch = userPurchasedUSDInCurrentEpoch + costUSD;

      await updateDoc(userSalePurchaseDocRef, {
        totalPurchasedUSD: newTotalPurchasedUSD,
        userPurchasedUSDInCurrentEpoch: newPurchasedUSDInCurrentEpoch,
        lastPurchaseEpoch: currentEpoch // Record the epoch of this purchase
      });
      setUserPurchasedUSD(newTotalPurchasedUSD);
      setUserPurchasedUSDInCurrentEpoch(newPurchasedUSDInCurrentEpoch);
      setLastPurchaseEpoch(currentEpoch);

      setModalMessage(`Successfully purchased ${amountToBuy.toFixed(0)} $eDINOSUR! Your total purchased is now $${newTotalPurchasedUSD.toFixed(2)}. Purchased in this epoch: $${newPurchasedUSDInCurrentEpoch.toFixed(2)}.`);
      setBuyAmount(''); // Clear input after purchase
    } catch (error) {
      console.error("Error during $eDINOSUR purchase:", error);
      setModalMessage(`Failed to complete purchase: ${error.message}`);
    }
  };

  const epochAllocationTokens = saleTotalTokens * MAX_EPOCH_ALLOCATION_PERCENTAGE;

  if (loadingPurchaseData) {
    return (
      <SectionWrapper id="edinosur-sale" title="$eDINOSUR Public Sale">
        <div className="text-center text-2xl text-gray-300 mt-10">Loading sale data...</div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="edinosur-sale" title="$eDINOSUR Public Sale">
      <div className="text-center max-w-4xl mx-auto">
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          Participate in the exclusive $eDINOSUR Public Sale! This is your chance to acquire $eDINOSUR tokens before the Token Generation Event, at a favorable price. A total of <span className="font-semibold text-yellow-300">1% of the total $DINOSUR supply (5 Billion $eDINOSUR)</span> will be sold in continuous epochs.
        </p>
        <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
          Each epoch lasts for 7 days, and the price of $eDINOSUR will increase by 10% at the start of each new epoch, beginning at $0.00005 per $eDINOSUR.
        </p>
        <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
          Max epoch allocation: {epochAllocationTokens.toLocaleString()} $eDINOSUR (5% of total sale tokens). Max epoch purchase limit: ${MAX_EPOCH_PURCHASE_USD} USD per wallet.
        </p>

        {/* Countdown Monitor */}
        <div className="bg-gray-700 rounded-xl p-6 shadow-lg mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Sale Starts In:</h3>
          {saleStarted ? (
            <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">SALE IS LIVE!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">{timeLeft.days}</p>
                <p className="text-base sm:text-lg text-gray-300">Days</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">{timeLeft.hours}</p>
                <p className="text-base sm:text-lg text-gray-300">Hours</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">{timeLeft.minutes}</p>
                <p className="text-base sm:text-lg text-gray-300">Minutes</p>
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">{timeLeft.seconds}</p>
                <p className="text-base sm:text-lg text-gray-300">Seconds</p>
              </div>
            </div>
          )}
        </div>

        {/* Epoch Info and Buying Box */}
        <div className="bg-gray-700 rounded-xl p-6 shadow-lg mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Current Epoch Information</h3>
          <p className="text-base sm:text-xl text-gray-300 mb-2">Epoch: <span className="font-mono text-yellow-400">{currentEpoch}</span></p>
          <p className="text-base sm:text-xl text-gray-300 mb-4">Current Price: <span className="font-mono text-yellow-400">${currentPrice.toFixed(7)} per $eDINOSUR</span></p>

          <div className="mt-6">
            <h4 className="text-xl sm:text-2xl font-bold text-green-300 mb-4">Buy $eDINOSUR</h4>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
              <label htmlFor="buy-amount" className="text-base sm:text-lg text-gray-300">Amount ($eDINOSUR):</label>
              <input
                id="buy-amount"
                type="number"
                min="0"
                step="1"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="w-full sm:w-64 p-3 rounded-lg bg-gray-900 text-white border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg"
                placeholder="Enter amount to buy"
              />
            </div>
            <p className="text-base sm:text-xl text-yellow-400 mb-4">Estimated Cost: <span className="font-mono">${totalPriceUSD.toFixed(2)} USD</span></p>
            <p className="text-sm sm:text-lg text-gray-300 mb-2">Your total purchased (lifetime): <span className="font-mono text-yellow-400">${userPurchasedUSD.toFixed(2)} USD</span> (Max: $1000 USD)</p>
            <p className="text-sm sm:text-lg text-gray-300 mb-4">Your purchased this epoch: <span className="font-mono text-yellow-400">${userPurchasedUSDInCurrentEpoch.toFixed(2)} USD</span> (Max: ${MAX_EPOCH_PURCHASE_USD} USD)</p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
              onClick={handleBuy}
              disabled={!saleStarted || totalPriceUSD === 0 || (userPurchasedUSD + totalPriceUSD > 1000) || (userPurchasedUSDInCurrentEpoch + totalPriceUSD > MAX_EPOCH_PURCHASE_USD)}
            >
              Buy $eDINOSUR Now
            </button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};


const RoadmapSection = () => (
  <SectionWrapper id="roadmap" title="Roadmap: Paving the Path to Primal Power">
    <div className="text-center max-w-4xl mx-auto">
      <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
        Our journey is just beginning! Explore the exciting milestones we're set to conquer, bringing more features, more battles, and more rewards to the Dino Fighter G1 community.
      </p>
      <div className="relative border-l-4 border-green-500 pl-6 sm:pl-8 py-4">
        {/* Roadmap Item 1 */}
        <div className="mb-8 sm:mb-10 text-left">
          <div className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full -left-2.5 sm:-left-3 border-3 sm:border-4 border-gray-800"></div>
          <h3 className="text-xl sm:text-3xl font-bold text-green-300 mb-2">Q3 2025: Genesis Launch</h3>
          <ul className="list-disc list-inside text-base sm:text-lg text-gray-300 space-y-1">
            <li>DApp platform launch</li>
            <li>Initial NFT collection release</li>
            <li>$DINOSUR token deployment</li>
            <li>Basic NFT staking functionality</li>
          </ul>
        </div>
        {/* Roadmap Item 2 */}
        <div className="mb-8 sm:mb-10 text-left">
          <div className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full -left-2.5 sm:-left-3 border-3 sm:border-4 border-gray-800"></div>
          <h3 className="text-xl sm:text-3xl font-bold text-green-300 mb-2">Q4 2025: Battle Arena Unleashed & TGE</h3>
          <ul className="list-disc list-inside text-base sm:text-lg text-gray-300 space-y-1">
            <li>Token Generation Event (TGE)</li>
            <li>PvP battle system implementation</li>
            <li>Advanced staking tiers</li>
            <li>Community governance features</li>
            <li>First major marketing campaign</li>
          </ul>
        </div>
        {/* Roadmap Item 3 */}
        <div className="mb-8 sm:mb-10 text-left">
          <div className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full -left-2.5 sm:-left-3 border-3 sm:border-4 border-gray-800"></div>
          <h3 className="text-xl sm:text-3xl font-bold text-green-300 mb-2">Q1 2026: Ecosystem Expansion</h3>
          <ul className="list-disc list-inside text-base sm:text-lg text-gray-300 space-y-1">
            <li>New NFT collections and legendary dinosaurs</li>
            <li>Integration with other blockchain games</li>
            <li>Mobile DApp development</li>
            <li>Global community events</li>
          </ul>
        </div>
        {/* Roadmap Item 4 */}
        <div className="text-left">
          <div className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full -left-2.5 sm:-left-3 border-3 sm:border-4 border-gray-800"></div>
          <h3 className="text-xl sm:text-3xl font-bold text-green-300 mb-2">Q2 2026: Metaverse Integration</h3>
          <ul className="list-disc list-inside text-base sm:text-lg text-gray-300 space-y-1">
            <li>Dino Fighter G1 metaverse land sales</li>
            <li>VR/AR integration exploration</li>
            <li>Cross-chain compatibility</li>
            <li>Decentralized autonomous organization (DAO) full launch</li>
          </ul>
        </div>
      </div>
    </div>
  </SectionWrapper>
);

const RaffleSlotSection = ({ userId, setModalMessage }) => {
  // Updated ticket cost
  const EDINOSUR_TICKET_COST = 50000;
  const EDINOSUR_BURN_AMOUNT_PERCENTAGE = 0.1; // Changed from 0.5 to 0.1 for 5000 burn

  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [totalCost, setTotalCost] = useState(EDINOSUR_TICKET_COST);
  const [ticketCount, setTicketCount] = useState(0);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [reel1, setReel1] = useState('🦖');
  const [reel2, setReel2] = useState('🦕');
  const [reel3, setReel3] = useState('🥚');
  const [isSpinning, setIsSpinning] = useState(false);
  const [blockchainActivity, setBlockchainActivity] = useState([]);

  // Define possible reel symbols
  const symbols = ['🦖', '🦕', '🥚', '💎', '💰', '🔥'];

  // Firestore path for user's raffle tickets
  const userRaffleDocRef = userId ? doc(db, `artifacts/${appId}/users/${userId}/data/raffle`) : null;
  // Firestore path for user's eDINOSUR balance (from staking)
  const userStakingDocRef = userId ? doc(db, `artifacts/${appId}/users/${userId}/data/staking`) : null;

  // Load initial data and set up real-time listener for tickets
  useEffect(() => {
    if (!userId || !userRaffleDocRef) {
      setLoadingTickets(false);
      return;
    }

    const unsubscribe = onSnapshot(userRaffleDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTicketCount(data.tickets || 0);
      } else {
        setTicketCount(0);
      }
      setLoadingTickets(false);
    }, (error) => {
      console.error("Error fetching raffle tickets data:", error);
      setModalMessage(`Error loading raffle data: ${error.message}`);
      setLoadingTickets(false);
    });

    return () => unsubscribe();
  }, [userId, userRaffleDocRef, setModalMessage]);

  useEffect(() => {
    setTotalCost(ticketQuantity * EDINOSUR_TICKET_COST);
  }, [ticketQuantity]);

  const updateFirestoreTickets = async (newTicketCount) => {
    if (!userRaffleDocRef) {
      setModalMessage("Please connect your wallet to save raffle data.");
      return;
    }
    try {
      await setDoc(userRaffleDocRef, { tickets: newTicketCount }, { merge: true });
    } catch (error) {
      console.error("Error updating raffle tickets:", error);
      setModalMessage(`Failed to update raffle tickets: ${error.message}`);
    }
  };

  // Simulate blockchain activity
  useEffect(() => {
    const activityMessages = [
      "New raffle spin initiated by UserXYZ...",
      "Prize of 10,000 $eDINOSUR distributed to UserABC!",
      "NFT 'Rare Dino #123' awarded to UserDEF.",
      "Transaction confirmed: Raffle ticket purchase by UserGHI.",
      "Monthly vesting of King NFT to UserJKL completed.",
      "UserMNO claimed $1.00 USDT prize.",
    ];

    const interval = setInterval(() => {
      const randomMessage = activityMessages[Math.floor(Math.random() * activityMessages.length)];
      setBlockchainActivity(prev => {
        const updatedActivity = [randomMessage, ...prev];
        return updatedActivity.slice(0, 5); // Keep only the last 5 activities
      });
    }, 3000); // Add a new activity every 3 seconds

    return () => clearInterval(interval);
  }, []);


  const handleBuyTickets = async () => {
    if (!userId || !userStakingDocRef) {
      setModalMessage("Please connect your wallet to buy tickets.");
      return;
    }

    // Logic for eDINOSUR purchase
    try {
      const docSnap = await getDoc(userStakingDocRef);
      let currentEDinosurBalance = 0;
      let currentReadyToBurnEDinosur = 0;
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentEDinosurBalance = data.earned || 0;
        currentReadyToBurnEDinosur = data.readyToBurnEDinosur || 0;
      }

      if (currentEDinosurBalance >= totalCost) {
        const newTicketCount = ticketCount + ticketQuantity;
        const remainingEDinosur = currentEDinosurBalance - totalCost;
        const burnAmount = totalCost * EDINOSUR_BURN_AMOUNT_PERCENTAGE; // 50% of total cost
        const newReadyToBurnEDinosur = currentReadyToBurnEDinosur + burnAmount;

        setModalMessage(`You are about to buy ${ticketQuantity} tickets for ${totalCost} $eDINOSUR. ${burnAmount.toFixed(2)} $eDINOSUR will be ready for burning.`);
        setTicketCount(newTicketCount);
        await updateFirestoreTickets(newTicketCount);
        await updateDoc(userStakingDocRef, {
          earned: remainingEDinosur,
          readyToBurnEDinosur: newReadyToBurnEDinosur
        }); // Deduct eDINOSur and add to readyToBurn
        setBlockchainActivity(prev => [`Ticket purchase: ${userId ? userId.substring(0, 6) : 'Anonymous'} bought ${ticketQuantity} tickets for ${totalCost} $eDINOSUR. ${burnAmount.toFixed(2)} $eDINOSUR marked for burn.`, ...prev].slice(0,5));
      } else {
        setModalMessage(`Insufficient $eDINOSUR. You need ${totalCost} $eDINOSUR but have ${currentEDinosurBalance.toFixed(2)}.`);
      }
    } catch (error) {
      console.error("Error buying tickets:", error);
      setModalMessage(`Failed to buy tickets: ${error.message}`);
    }
  };

  const handleSpin = () => {
    if (isSpinning) {
      setModalMessage("Reels are already spinning! Please wait.");
      return;
    }

    if (ticketCount > 0) {
      setIsSpinning(true);
      setModalMessage("Spinning the slot machine! Good luck!");

      // Simulate spinning reels
      const spinDuration = 2000; // 2 seconds
      const spinInterval = 100; // Update reels every 100ms

      let spinTimer = 0;
      const intervalId = setInterval(() => {
        setReel1(symbols[Math.floor(Math.random() * symbols.length)]);
        setReel2(symbols[Math.floor(Math.random() * symbols.length)]);
        setReel3(symbols[Math.floor(Math.random() * symbols.length)]);
        spinTimer += spinInterval;

        if (spinTimer >= spinDuration) {
          clearInterval(intervalId);
          setIsSpinning(false);
          const newTicketCount = ticketCount - 1;
          setTicketCount(newTicketCount); // Consume one ticket per spin
          updateFirestoreTickets(newTicketCount);

          // Determine result (simplified for simulation)
          const finalReel1 = symbols[Math.floor(Math.random() * symbols.length)];
          const finalReel2 = symbols[Math.floor(Math.random() * symbols.length)];
          const finalReel3 = symbols[Math.floor(Math.random() * symbols.length)];
          setReel1(finalReel1);
          setReel2(finalReel2);
          setReel3(finalReel3);

          let spinResult = "";
          if (finalReel1 === finalReel2 && finalReel2 === finalReel3) {
            spinResult = `JACKPOT! You won with ${finalReel1} ${finalReel2} ${finalReel3}!`;
          } else if (finalReel1 === finalReel2 || finalReel2 === finalReel3 || finalReel1 === finalReel3) {
            spinResult = `You got two matching symbols! Try again!`;
          } else {
            spinResult = `No win this time. Keep spinning!`;
          }
          setModalMessage(spinResult);
          setBlockchainActivity(prev => [`Spin by ${userId ? userId.substring(0, 6) : 'Anonymous'}: ${spinResult}`, ...prev].slice(0,5));
        }
      }, spinInterval);

    } else {
      setModalMessage("You need to buy tickets first!");
    }
  };

  if (loadingTickets) {
    return (
      <SectionWrapper id="raffle-slot" title="Raffle Slot: Win Legendary Rewards!">
        <div className="text-center text-2xl text-gray-300 mt-10">Loading raffle data...</div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="raffle-slot" title="Raffle Slot: Win Legendary Rewards!">
      <style>
        {`
        @keyframes spin-reel-animation {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); } /* Simulates scrolling up */
        }
        .reel-item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%; /* Each symbol takes full height of its container */
          font-size: 3rem; /* Adjusted for responsiveness */
          font-weight: bold;
          color: #FFD700; /* Gold color for symbols */
        }
        .reel-container {
          overflow: hidden;
          border: 3px solid #FFD700; /* Gold border */
          border-radius: 8px;
          background-color: #222; /* Dark background for reels */
          box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column; /* Arrange symbols vertically */
          justify-content: space-around;
        }
        .spinning .reel-item {
          animation: spin-reel-animation 0.1s linear infinite; /* Fast, continuous spin */
        }
        `}
      </style>
      <div className="text-center max-w-4xl mx-auto">
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          The $DINOSUR Grand Raffle: Spin for Fortune! Use your hard-earned <span className="font-semibold text-yellow-300">$eDINOSUR</span> tokens to purchase raffle tickets directly within the DApp. Each ticket represents an entry into our provably fair slot machine-style drawing, giving you a chance to win incredible prizes. This is your opportunity to turn your staking rewards into even greater assets!
        </p>

        <div className="bg-gray-700 rounded-xl p-6 sm:p-8 shadow-lg mb-8">
          <h3 className="text-3xl sm:text-4xl font-bold text-green-300 mb-4 sm:mb-6">Buy Raffle Tickets</h3>
          <div className="flex justify-center items-center gap-4 sm:gap-6 mb-4">
            <label className="flex items-center text-base sm:text-xl text-gray-300 cursor-pointer">
              <span className="ml-2">{EDINOSUR_TICKET_COST} $eDINOSUR</span>
            </label>
          </div>
          <p className="text-base sm:text-xl text-gray-300 mb-4">Cost per ticket: {EDINOSUR_TICKET_COST} $eDINOSUR</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
            <label htmlFor="ticket-quantity" className="text-base sm:text-lg text-gray-300">Quantity:</label>
            <input
              id="ticket-quantity"
              type="number"
              min="1"
              value={ticketQuantity}
              onChange={(e) => setTicketQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full sm:w-32 p-3 rounded-lg bg-gray-900 text-white border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg"
            />
            <p className="text-xl sm:text-2xl text-yellow-400">Total Cost: <span className="font-mono">{totalCost} $eDINOSUR</span></p>
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
            onClick={handleBuyTickets}
          >
            Buy Tickets
          </button>
          {/* Added text below the button */}
          <p className="text-sm sm:text-lg text-gray-300 mt-4">For each ticket purchased with $eDINOSUR, {EDINOSUR_TICKET_COST * EDINOSUR_BURN_AMOUNT_PERCENTAGE} $eDINOSUR will be sent to a burn contract, contributing to the token's deflationary supply.</p>
        </div>

        <div className="bg-gray-700 rounded-xl p-6 sm:p-8 shadow-lg">
          <h3 className="text-3xl sm:text-4xl font-bold text-green-300 mb-4 sm:mb-6">Raffle Slot Machine</h3>
          <div className="bg-gray-900 border-8 border-yellow-600 rounded-lg p-4 mb-6 flex justify-around items-center h-48 sm:h-64 overflow-hidden relative shadow-xl">
            {/* Slot Machine Reels */}
            <div className={`reel-container w-1/3 h-full flex flex-col items-center justify-center ${isSpinning ? 'spinning' : ''}`}>
              <div className="reel-item">{reel1}</div>
              {isSpinning && symbols.map((s, i) => <div key={`r1-${i}`} className="reel-item">{s}</div>)}
            </div>
            <div className={`reel-container w-1/3 h-full flex flex-col items-center justify-center ${isSpinning ? 'spinning' : ''}`}>
              <div className="reel-item">{reel2}</div>
              {isSpinning && symbols.map((s, i) => <div key={`r2-${i}`} className="reel-item">{s}</div>)}
            </div>
            <div className={`reel-container w-1/3 h-full flex flex-col items-center justify-center ${isSpinning ? 'spinning' : ''}`}>
              <div className="reel-item">{reel3}</div>
              {isSpinning && symbols.map((s, i) => <div key={`r3-${i}`} className="reel-item">{s}</div>)}
            </div>
            {/* Overlay for visual effect */}
            <div className="absolute inset-0 border-y-4 border-gray-400 pointer-events-none"></div>
          </div>
          <p className="text-xl sm:text-2xl text-yellow-400 mb-4">Tickets Available: <span className="font-mono">{ticketCount}</span></p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
            onClick={handleSpin}
            disabled={isSpinning}
          >
            {isSpinning ? 'Spinning...' : 'Spin!'}
          </button>
        </div>

        {/* Blockchain Activity Display Monitor - Moved here */}
        <div className="mt-8 sm:mt-10 bg-gray-700 rounded-xl p-6 sm:p-8 shadow-lg">
          <h3 className="text-3xl sm:text-4xl font-bold text-green-300 mb-4 sm:mb-6">Raffle Blockchain Activity</h3>
          <div className="bg-gray-900 border-4 border-blue-500 rounded-lg p-4 h-40 sm:h-48 overflow-y-auto text-left font-mono text-xs sm:text-sm text-gray-300 shadow-inner">
            {blockchainActivity.length === 0 ? (
              <p className="text-center text-gray-400">No recent activity...</p>
            ) : (
              blockchainActivity.map((activity, index) => (
                <p key={index} className="mb-1">{activity}</p>
              ))
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-4">
            (Simulated blockchain activity for demonstration purposes.)
          </p>
        </div>

        <div className="mt-8 sm:mt-10 bg-gray-700 rounded-xl p-6 sm:p-8 shadow-lg">
          <h3 className="text-3xl sm:text-4xl font-bold text-green-300 mb-4 sm:mb-6">Win Incredible Prizes!</h3>
          <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
            It's your chance to turn your <span className="font-semibold text-yellow-300">$eDINOSUR</span> into extraordinary rewards! The raffle offers a diverse range of prizes, from valuable USDT to exclusive NFTs, making every spin a thrilling opportunity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-base sm:text-lg text-gray-300">
            <div>
              <h4 className="font-bold text-yellow-300 mb-2">USDT Rewards:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>$0.50 USDT</li>
                <li>$1.00 USDT</li>
                <li>$3.00 USDT</li>
                <li>$5.00 USDT</li>
                <li>$10.00 USDT</li>
                <li>$15.00 USDT</li>
                <li>$30.00 USDT</li>
                <li>$50.00 USDT</li>
                <li>$100.00 USDT</li>
                <li>$250.00 USDT</li>
                <li>$500.00 USDT</li>
                <li>$1000.00 USDT</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-yellow-300 mb-2">$eDINOSUR Rewards:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>10,000 $eDINOSUR</li>
                <li>20,000 $eDINOSUR</li>
                <li>30,000 $eDINOSUR</li> {/* Added */}
                <li>40,000 $eDINOSUR</li> {/* Added */}
                <li>50,000 $eDINOSUR</li>
                <li>70,000 $eDINOSUR</li> {/* Added */}
                <li>85,000 $eDINOSUR</li> {/* Added */}
                <li>100,000 $eDINOSUR</li>
                <li>125,000 $eDINOSUR</li> {/* Added */}
                <li>500,000 $eDINOSUR</li>
                <li>1,000,000 $eDINOSUR</li>
                <li>1,500,000 $eDINOSUR</li>
                <li>2,000,000 $eDINOSUR</li>
              </ul>
              <h4 className="font-bold text-yellow-300 mt-4 mb-2">NFT Rewards:</h4>
              <p className="text-gray-300 text-sm mb-2">Win a chance to acquire rare Dino Fighter G1 NFTs, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><span className="font-semibold">Common, Rare, Unique NFTs:</span> 50% of these NFTs are exclusively available through the raffle, distributed with monthly vesting to ensure fair play and sustained excitement.</li>
                <li><span className="font-semibold">King NFT:</span> A limited supply of 250 King NFTs will be distributed over 6 months, offering significant staking multipliers.</li>
                <li><span className="font-semibold">Legend NFT:</span> Only 80 Legend NFTs will be available through the raffle over 6 months, representing the ultimate prize for their unparalleled earning power.</li>
                <li><span className="font-semibold">$DINOSUR Stamp:</span> After TGE, you will be able to mint King and Legend NFTs free by burning Stamps.</li> {/* Added */}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

const AffiliatePagesSection = ({ userId, setModalMessage }) => {
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0); // This now represents $eDINOSUR earnings
  const [loadingAffiliateData, setLoadingAffiliateData] = useState(true);

  const affiliateDocRef = userId ? doc(db, `artifacts/${appId}/users/${userId}/data/affiliate`) : null;

  // Generate referral code and link, and load affiliate data from Firestore
  useEffect(() => {
    if (!userId || !affiliateDocRef) {
      setLoadingAffiliateData(false);
      return;
    }

    // Generate a simple referral code based on userId
    const generatedCode = userId.substring(0, 8).toUpperCase(); // First 8 chars of UID
    setReferralCode(generatedCode);
    setReferralLink(`${window.location.origin}/?ref=${generatedCode}`); // Example link

    const unsubscribe = onSnapshot(affiliateDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setReferralCount(data.referralCount || 0);
        setReferralEarnings(data.referralEarnings || 0);
      } else {
        // Initialize if document doesn't exist
        setReferralCount(0);
        setReferralEarnings(0);
        // Optionally, create the document with initial values
        setDoc(affiliateDocRef, { referralCount: 0, referralEarnings: 0 }, { merge: true }).catch(e => console.error("Error initializing affiliate data:", e));
      }
      setLoadingAffiliateData(false);
    }, (error) => {
      console.error("Error fetching affiliate data:", error);
      setModalMessage(`Error loading affiliate data: ${error.message}`);
      setLoadingAffiliateData(false);
    });

    return () => unsubscribe();
  }, [userId, affiliateDocRef, setModalMessage]);

  // Simulate referral earnings over time (for demonstration)
  useEffect(() => {
    if (!userId || loadingAffiliateData) return;

    // Simulate earnings based on referral count
    const earningRatePerReferralPerSecond = 75000 / (24 * 60 * 60); // 75,000 $eDINOSUR per referral per day

    const interval = setInterval(() => {
      setReferralEarnings(prev => prev + (referralCount * earningRatePerReferralPerSecond));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [userId, loadingAffiliateData, referralCount]); // Recalculate if referralCount changes

  const updateFirestoreAffiliateData = async (updatedCount, updatedEarnings) => {
    if (!affiliateDocRef) {
      setModalMessage("Please connect your wallet to save affiliate data.");
      return;
    }
    try {
      await setDoc(affiliateDocRef, { referralCount: updatedCount, referralEarnings: updatedEarnings }, { merge: true });
    } catch (error) {
      console.error("Error updating affiliate data:", error);
      setModalMessage(`Failed to update affiliate data: ${error.message}`);
    }
  };

  const handleCopyReferralLink = () => {
    if (referralLink) {
      document.execCommand('copy'); // Fallback for navigator.clipboard
      const textarea = document.createElement('textarea');
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setModalMessage("Referral link copied to clipboard!");
    }
  };

  const handleClaimReferralEarnings = async () => {
    if (referralEarnings > 0) {
      setModalMessage(`Claimed ${referralEarnings.toFixed(2)} $eDINOSUR from referrals! This will be claimable as $DINOSUR at TGE.`);
      // In a real DApp, this would add to the user's eDINOSUR balance
      // For simulation, we'll reset affiliate earnings and add to user's eDINOSUR (staking) balance
      try {
        const userStakingDoc = doc(db, `artifacts/${appId}/users/${userId}/data/staking`);
        const docSnap = await getDoc(userStakingDoc);
        const currentEDinosur = docSnap.exists() ? docSnap.data().earned || 0 : 0;
        await updateDoc(userStakingDoc, { earned: currentEDinosur + referralEarnings }); // Add to eDINOSUR balance
        setReferralEarnings(0); // Reset affiliate earnings
        await updateFirestoreAffiliateData(referralCount, 0); // Update Firestore for affiliate earnings
      } catch (error) {
        console.error("Error claiming referral earnings:", error);
        setModalMessage(`Failed to claim referral earnings: ${error.message}`);
      }
    } else {
      setModalMessage("No referral earnings to claim yet!");
    }
  };

  // For demonstration: simulate a new referral
  const simulateNewReferral = () => {
    const newCount = referralCount + 1;
    setReferralCount(newCount);
    updateFirestoreAffiliateData(newCount, referralEarnings);
    setModalMessage("Simulated: A new referral joined!");
  };


  if (loadingAffiliateData) {
    return (
      <SectionWrapper id="affiliate-pages" title="Affiliate Program: Share the Roar, Earn Rewards!">
        <div className="text-center text-2xl text-gray-300 mt-10">Loading your affiliate data...</div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="affiliate-pages" title="Affiliate Program: Share the Roar, Earn Rewards!">
      <div className="text-center max-w-4xl mx-auto">
        <p className="text-base sm:text-xl text-gray-200 mb-4 sm:mb-6 leading-relaxed">
          Join the Dino Fighter G1 Affiliate Program and earn substantial rewards by introducing new adventurers to our prehistoric world. Share your unique referral link and watch your earnings grow! This program is designed to reward our most dedicated community members for helping us expand the Dino Fighter G1 ecosystem.
        </p>
        <p className="text-base sm:text-xl text-yellow-300 mb-4 sm:mb-6 leading-relaxed font-semibold">
          Earned $eDINOSUR from referrals will be claimable as $DINOSUR at TGE (1:1 ratio). This means your efforts in growing the community directly translate into valuable $DINOSUR tokens. You can also use your $eDINOSUR to buy Raffle Slot tickets and win big, providing immediate utility for your referral rewards!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-8">
          <div className="bg-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">How it Works</h3>
            <ul className="text-left text-base sm:text-lg text-gray-300 space-y-2">
              <li><span className="font-semibold">Sign Up:</span> Easily join the affiliate program through your DApp profile.</li>
              <li><span className="font-semibold">Get Your Link:</span> Receive a unique referral link instantly. This link tracks all users who sign up through your invitation.</li>
              <li><span className="font-semibold">Share & Promote:</span> Share your link across your social media, communities, and networks.</li>
              <li><span className="font-semibold">Earn Rewards:</span> You will earn a generous 75,000 $eDINOSUR for every new user who successfully joins and participates in the DApp through your unique referral link!</li>
              <li><span className="font-semibold">Track Performance:</span> Monitor your referrals and earnings in real-time on your personalized dashboard.</li>
            </ul>
          </div>
          <div className="bg-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Why Join?</h3>
            <ul className="list-disc list-inside text-base sm:text-lg text-gray-300 space-y-2">
              <li><span className="font-semibold">Competitive Commission:</span> Our program offers highly attractive rewards for every successful referral.</li>
              <li><span className="font-semibold">Real-Time Tracking:</span> Transparency is key. See your referrals and earnings update instantly.</li>
              <li><span className="font-semibold">Dedicated Support:</span> Our team is here to help you succeed, providing resources and assistance.</li>
              <li><span className="font-semibold">Grow the Ecosystem:</span> Be an integral part of expanding the Dino Fighter G1 community and contribute to the project's success.</li>
              <li><span className="font-semibold">Early Access & Perks:</span> Active affiliates may gain access to exclusive events, early announcements, or special bonuses.</li>
            </ul>
          </div>
        </div>

        {/* Referral Code Panel */}
        <div className="bg-gray-700 rounded-xl p-6 shadow-lg mt-8 sm:mt-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Your Unique Referral Link</h3>
          <div className="bg-gray-900 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <p className="text-base sm:text-lg text-gray-200 break-all">{referralLink}</p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full text-sm sm:text-md shadow-md flex-shrink-0"
              onClick={handleCopyReferralLink}
            >
              Copy Link
            </button>
          </div>
          <p className="text-base sm:text-lg text-gray-300">Your Referral Code: <span className="font-mono text-yellow-400">{referralCode}</span></p>
        </div>

        {/* Referral Monitoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-10">
          <div className="bg-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Referral Count</h3>
            <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">{referralCount}</p>
            <p className="text-base sm:text-lg text-gray-300 mt-2">Total users who have joined the Dino Fighter G1 DApp through your unique referral link.</p>
            {/* For demonstration: a button to simulate new referrals */}
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full text-sm shadow-md mt-4"
              onClick={simulateNewReferral}
            >
              Simulate New Referral
            </button>
          </div>

          <div className="bg-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-4">Referral Earnings</h3>
            <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">{referralEarnings.toFixed(2)} $eDINOSUR</p>
            <p className="text-base sm:text-lg text-gray-300 mt-2">Your accumulated $eDINOSUR from successful referrals. This balance is updated in real-time as your referrals engage with the DApp.</p>
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-base sm:text-lg shadow-md mt-4"
              onClick={handleClaimReferralEarnings}
            >
              Claim Earnings to $eDINOSUR Balance
            </button>
          </div>
        </div>

        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full text-base sm:text-xl shadow-lg transform hover:scale-105 transition-transform duration-300 mt-8 sm:mt-10">
          Become an Affiliate
        </button>
        <p className="text-sm sm:text-lg text-gray-400 mt-8">
          For more details, please refer to our full Affiliate Program Terms and Conditions. Join us in building the most exciting P2E ecosystem!
        </p>
      </div>
    </SectionWrapper>
  );
};

export default App;
