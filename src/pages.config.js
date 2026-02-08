/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AdminDesign from './pages/AdminDesign';
import AdminLegal from './pages/AdminLegal';
import AdminReservations from './pages/AdminReservations';
import AdminRestaurants from './pages/AdminRestaurants';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminUsers from './pages/AdminUsers';
import Backoffice from './pages/Backoffice';
import BackofficeAnalytics from './pages/BackofficeAnalytics';
import BackofficeBlocks from './pages/BackofficeBlocks';
import BackofficeDashboard from './pages/BackofficeDashboard';
import BackofficeReservations from './pages/BackofficeReservations';
import BackofficeSchedules from './pages/BackofficeSchedules';
import BackofficeSettings from './pages/BackofficeSettings';
import BackofficeSubscription from './pages/BackofficeSubscription';
import BackofficeTables from './pages/BackofficeTables';
import Home from './pages/Home';
import MentionsLegales from './pages/MentionsLegales';
import MyReservations from './pages/MyReservations';
import RGPD from './pages/RGPD';
import Restaurant from './pages/Restaurant';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminDesign": AdminDesign,
    "AdminLegal": AdminLegal,
    "AdminReservations": AdminReservations,
    "AdminRestaurants": AdminRestaurants,
    "AdminSubscriptions": AdminSubscriptions,
    "AdminUsers": AdminUsers,
    "Backoffice": Backoffice,
    "BackofficeAnalytics": BackofficeAnalytics,
    "BackofficeBlocks": BackofficeBlocks,
    "BackofficeDashboard": BackofficeDashboard,
    "BackofficeReservations": BackofficeReservations,
    "BackofficeSchedules": BackofficeSchedules,
    "BackofficeSettings": BackofficeSettings,
    "BackofficeSubscription": BackofficeSubscription,
    "BackofficeTables": BackofficeTables,
    "Home": Home,
    "MentionsLegales": MentionsLegales,
    "MyReservations": MyReservations,
    "RGPD": RGPD,
    "Restaurant": Restaurant,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};