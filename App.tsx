
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Layers, CheckCircle2, Calendar, User, Plane, Plus, ScanFace, Trash2, Edit } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { ItemDetailModal } from './components/ItemDetailModal';
import { WardrobeGallery } from './components/WardrobeGallery';
import { OutfitCreator } from './components/OutfitCreator';
import { OutfitCalendar } from './components/OutfitCalendar';
import { StyleProfile } from './components/StyleProfile';
import { TripPlannerModal } from './components/TripPlannerModal';
import { TripDetail } from './components/TripDetail';
import { AvatarSetup } from './components/AvatarSetup';
import { FittingRoom } from './components/FittingRoom';
import { OnboardingQuiz } from './components/OnboardingQuiz';
import { OnboardingTour } from './components/OnboardingTour';
import { ClothingItem, Outfit, ScheduleEntry, UserProfile, Trip } from './types';
import { format } from 'date-fns';

const App: React.FC = () => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [currentView, setCurrentView] = useState<'closet' | 'studio' | 'plan' | 'trips' | 'fitting-room' | 'profile'>('closet');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('Action Successful');

  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [planningDate, setPlanningDate] = useState<string | null>(null);
  
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [showAvatarSetup, setShowAvatarSetup] = useState(false);
  const [itemToTryOn, setItemToTryOn] = useState<ClothingItem | null>(null);

  // Clear any persisted data on mount to ensure fresh start on reload
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const triggerToast = (msg: string) => {
      setToastMessage(msg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  // --- Handlers for ImageUploader ---

  const handleAnalysisStart = () => {
    setIsUploading(true);
  };

  const handleAnalysisComplete = (newItem: ClothingItem) => {
    setIsUploading(false);
    setSelectedItem(newItem);
    setIsModalOpen(true);
  };

  const handleBatchItem = (newItem: ClothingItem) => {
      // Directly add to state without opening modal
      setItems(prev => [newItem, ...prev]);
  };

  const handleBatchComplete = (count: number) => {
      triggerToast(`Batch upload complete! ${count} items added.`);
      setIsUploading(false);
  };

  // ----------------------------------

  const handleSaveItem = (itemToSave: ClothingItem) => {
    setItems((prev) => {
      const exists = prev.find(i => i.id === itemToSave.id);
      if (exists) {
        return prev.map(i => i.id === itemToSave.id ? itemToSave : i);
      }
      return [itemToSave, ...prev];
    });
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleOpenItem = (item: ClothingItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSaveOutfit = (outfitToSave: Outfit) => {
    setOutfits(prev => {
      const exists = prev.find(o => o.id === outfitToSave.id);
      if (exists) {
        return prev.map(o => o.id === outfitToSave.id ? outfitToSave : o);
      }
      return [outfitToSave, ...prev];
    });
    
    setEditingOutfit(null);
    
    if (planningDate) {
        handleUpdateSchedule({
            date: planningDate,
            outfitId: outfitToSave.id
        });
        setPlanningDate(null);
        setCurrentView('plan');
    }

    triggerToast(planningDate ? 'Saved & Scheduled' : 'Outfit Saved');
  };

  const handleEditOutfit = (outfit: Outfit) => {
    setEditingOutfit(outfit);
    setCurrentView('studio');
  };

  const handleStartPlanning = (date: string) => {
      setPlanningDate(date);
      setEditingOutfit(null);
      setCurrentView('studio');
  };

  const handleCancelStudio = () => {
      if (planningDate) {
          setPlanningDate(null);
          setCurrentView('plan');
      } else {
          setEditingOutfit(null);
      }
  };

  const handleUpdateSchedule = (entry: ScheduleEntry) => {
    setSchedule(prev => {
        const filtered = prev.filter(s => s.date !== entry.date);
        return [...filtered, entry];
    });
  };

  const handleRemoveSchedule = (date: string) => {
      setSchedule(prev => prev.filter(s => s.date !== date));
  };

  const handleClearData = () => {
      // Reloading will trigger the useEffect that clears storage
      window.location.reload(); 
  };

  const handleTripCreated = (newTrip: Trip) => {
      setTrips(prev => [newTrip, ...prev]);
      setSelectedTrip(newTrip); 
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
      setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
      if (selectedTrip?.id === updatedTrip.id) {
          setSelectedTrip(updatedTrip);
      }
      triggerToast('Trip Updated');
  };

  const handleDeleteTrip = (tripId: string) => {
      if (window.confirm("Are you sure you want to delete this trip?")) {
          setTrips(prev => prev.filter(t => t.id !== tripId));
          if (selectedTrip?.id === tripId) {
              setSelectedTrip(null);
          }
          triggerToast('Trip Deleted');
      }
  };

  const handleNavigateToTryOn = (item?: ClothingItem) => {
      if (!userProfile) return;

      if (!userProfile.facePhoto) {
          setItemToTryOn(item || null);
          setShowAvatarSetup(true);
          return;
      }

      setItemToTryOn(item || null);
      setCurrentView('fitting-room');
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
      setUserProfile(updatedProfile);
      setShowAvatarSetup(false);
      if (currentView === 'fitting-room' || itemToTryOn) {
         setCurrentView('fitting-room');
      }
  };
  
  const handleOnboardingComplete = (profile: UserProfile) => {
      setUserProfile(profile);
  };

  if (!userProfile) {
      return <OnboardingQuiz onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen font-sans bg-gray-50/50 pb-24 sm:pb-0">
      
      {userProfile && <OnboardingTour onComplete={() => {}} setCurrentView={setCurrentView} />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => setCurrentView('closet')}>
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">Shelfie</h1>
          </div>
          
          <nav className="hidden sm:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full">
            {[
                { id: 'closet', label: 'Closet' },
                { id: 'studio', label: 'Studio' },
                { id: 'plan', label: 'Plan' },
                { id: 'trips', label: 'Trips' },
                { id: 'fitting-room', label: 'Fitting Room' },
                { id: 'profile', label: 'Profile' }
            ].map(tab => (
                <button
                    key={tab.id}
                    id={`nav-${tab.id}`}
                    onClick={() => {
                        if (tab.id === 'fitting-room') {
                            handleNavigateToTryOn();
                        } else {
                            setCurrentView(tab.id as any);
                        }
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        currentView === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
          </nav>

          <div className="flex flex-col items-end justify-center">
            {/* Phase 8.0 hidden as requested */}
            <span className="text-[10px] text-gray-400 font-medium tracking-wide hover:text-blue-500 transition-colors cursor-default">
              created with &lt;3 by Praneetozing
            </span>
          </div>
        </div>
      </header>

      <main className="pt-8 sm:pt-12">
        <AnimatePresence mode="wait">
            
            {currentView === 'closet' && (
                <motion.div
                    key="closet"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                >
                    <section className="px-4 sm:px-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
                                Digitize your style.
                            </h2>
                            <p className="text-gray-500 text-lg">
                                Drag, drop, and let AI organize your wardrobe.
                            </p>
                        </div>
                        <ImageUploader 
                            onAnalysisStart={handleAnalysisStart}
                            onAnalysisComplete={handleAnalysisComplete}
                            onBatchItem={handleBatchItem}
                            onBatchComplete={handleBatchComplete}
                        />
                    </section>
                    <section className="bg-white min-h-[500px] rounded-t-[40px] border-t border-gray-200/50 pt-12 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                        <WardrobeGallery items={items} onItemClick={handleOpenItem} />
                    </section>
                </motion.div>
            )}

            {currentView === 'studio' && (
                <motion.div
                    key="studio"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="px-4 sm:px-6 mb-8 text-center sm:text-left max-w-7xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900">
                          {planningDate 
                            ? `Planning for ${format(new Date(planningDate), 'EEEE, MMM d')}`
                            : editingOutfit 
                                ? 'Edit Outfit' 
                                : 'Outfit Studio'}
                        </h2>
                        <p className="text-gray-500">
                          {planningDate
                            ? 'Create a new look for this day.'
                            : editingOutfit 
                                ? 'Update your composition.' 
                                : 'Mix and match to create your perfect look.'}
                        </p>
                    </div>
                    <OutfitCreator 
                      items={items} 
                      onSaveOutfit={handleSaveOutfit} 
                      initialData={editingOutfit}
                      onCancelEdit={handleCancelStudio}
                      planningDate={planningDate}
                    />
                </motion.div>
            )}

            {currentView === 'plan' && (
                <motion.div
                    key="plan"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                     <div className="px-4 sm:px-6 mb-8 text-center sm:text-left max-w-7xl mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900">Style Agenda</h2>
                        <p className="text-gray-500">Plan your looks for the week ahead.</p>
                    </div>
                    <OutfitCalendar 
                        outfits={outfits} 
                        schedule={schedule}
                        trips={trips} 
                        onUpdateSchedule={handleUpdateSchedule}
                        onRemoveSchedule={handleRemoveSchedule}
                        onEditOutfit={handleEditOutfit}
                        onStartPlanning={handleStartPlanning}
                        onEditTrip={(trip) => {
                             setSelectedTrip(trip);
                             setCurrentView('trips');
                        }}
                    />
                </motion.div>
            )}

            {currentView === 'trips' && (
                <motion.div
                    key="trips"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {selectedTrip ? (
                        <TripDetail 
                            trip={selectedTrip} 
                            wardrobe={items} 
                            onBack={() => setSelectedTrip(null)}
                            onUpdateTrip={handleUpdateTrip}
                            onDeleteTrip={(id) => handleDeleteTrip(id)}
                        />
                    ) : (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6">
                            <div className="flex justify-between items-center mb-8" id="trips-nav">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">Trips</h2>
                                    <p className="text-gray-500">Smart packing lists & itineraries.</p>
                                </div>
                                <button 
                                    onClick={() => setIsTripModalOpen(true)}
                                    className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                                >
                                    <Plus size={20} /> New Trip
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trips.map(trip => (
                                    <motion.div
                                        key={trip.id}
                                        whileHover={{ y: -5 }}
                                        onClick={() => setSelectedTrip(trip)}
                                        className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative z-10 hover:z-20"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <Plane size={24} />
                                            </div>
                                            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                                {format(new Date(trip.startDate), 'MMM yyyy')}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{trip.destination}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">{trip.eventsDescription}</p>
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-400">
                                            <span>
                                                {(trip.dailyPlan?.length || 0)} Days
                                            </span>
                                            <span>•</span>
                                            <span>{trip.weatherSummary}</span>
                                        </div>
                                        
                                        <div className="absolute top-4 right-4 flex gap-2 z-50">
                                             <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteTrip(trip.id);
                                                }}
                                                className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors border border-gray-100 hover:border-red-100 z-50"
                                                title="Delete Trip"
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                        </div>
                                    </motion.div>
                                ))}
                                {trips.length === 0 && (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Plane size={24} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-900 font-medium">No upcoming trips</p>
                                        <button onClick={() => setIsTripModalOpen(true)} className="text-blue-500 text-sm mt-1 hover:underline">
                                            Plan your first getaway
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {currentView === 'fitting-room' && (
                <motion.div
                    key="fitting-room"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <FittingRoom 
                        userProfile={userProfile} 
                        wardrobe={items}
                        initialItem={itemToTryOn}
                        onClose={() => setCurrentView('closet')} 
                    />
                </motion.div>
            )}

            {currentView === 'profile' && (
                <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <StyleProfile 
                        profile={userProfile} 
                        onUpdateProfile={(updated) => {
                             setUserProfile(updated);
                             triggerToast('Profile Updated');
                        }}
                        onClearData={handleClearData}
                    />
                </motion.div>
            )}

        </AnimatePresence>
      </main>

      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-6 inset-x-0 mx-auto w-max sm:hidden z-40">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-xl border border-white/20">
            {[
                { id: 'closet', icon: LayoutGrid },
                { id: 'studio', icon: Layers },
                { id: 'plan', icon: Calendar },
                { id: 'trips', icon: Plane },
                { id: 'fitting-room', icon: ScanFace },
                { id: 'profile', icon: User }
            ].map((tab, index) => (
                <React.Fragment key={tab.id}>
                    <button
                        onClick={() => {
                            if (tab.id === 'fitting-room') {
                                handleNavigateToTryOn();
                            } else {
                                setCurrentView(tab.id as any);
                            }
                        }}
                        className={`p-3 rounded-full transition-all ${
                            currentView === tab.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'
                        }`}
                    >
                        <tab.icon size={24} />
                    </button>
                    {index < 5 && <div className="w-px h-6 bg-gray-200 mx-1"></div>}
                </React.Fragment>
            ))}
        </div>
      </div>

      <AnimatePresence>
        {showToast && (
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-24 sm:bottom-10 right-4 sm:right-10 z-50 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 flex items-center gap-3"
            >
                <div className="bg-green-100 text-green-600 p-1 rounded-full">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">
                        {toastMessage}
                    </p>
                    <p className="text-gray-500 text-xs">Your changes have been saved.</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <ItemDetailModal 
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        onTryOn={handleNavigateToTryOn}
      />

      <TripPlannerModal 
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        wardrobe={items}
        userProfile={userProfile}
        onTripCreated={handleTripCreated}
      />

      <AnimatePresence>
          {showAvatarSetup && (
              <AvatarSetup 
                  currentProfile={userProfile} 
                  onSave={handleSaveProfile} 
                  onCancel={() => setShowAvatarSetup(false)} 
              />
          )}
      </AnimatePresence>

    </div>
  );
};

export default App;
