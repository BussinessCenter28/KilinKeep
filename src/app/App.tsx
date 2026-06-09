// Route table. Public auth routes + the protected app (RequireAuth → Layout).
// Page modules are implemented per-feature; this file is the single source of
// truth for the URL → component mapping.
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth, RequireOwner } from './guards';
import { Layout } from '@/components/Layout';

import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SignupPage } from '@/features/auth/pages/SignupPage';

import { TestsListPage } from '@/features/tests/pages/TestsListPage';
import { NewTestPage } from '@/features/tests/pages/NewTestPage';
import { EditTestPage } from '@/features/tests/pages/EditTestPage';
import { TestDetailPage } from '@/features/tests/pages/TestDetailPage';

import { RecipesListPage } from '@/features/recipes/pages/RecipesListPage';
import { NewRecipePage } from '@/features/recipes/pages/NewRecipePage';
import { RecipeDetailPage } from '@/features/recipes/pages/RecipeDetailPage';

import { FiringsListPage } from '@/features/firings/pages/FiringsListPage';
import { NewFiringPage } from '@/features/firings/pages/NewFiringPage';
import { FiringDetailPage } from '@/features/firings/pages/FiringDetailPage';

import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { AssistantPage } from '@/features/assistant/pages/AssistantPage';
import { BillingPage } from '@/features/billing/pages/BillingPage';
import { AdminPage } from '@/features/admin/pages/AdminPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<TestsListPage />} />
        <Route path="/tests/new" element={<NewTestPage />} />
        <Route path="/tests/:id" element={<TestDetailPage />} />
        <Route path="/tests/:id/edit" element={<EditTestPage />} />
        <Route path="/tests/:id/assistant" element={<AssistantPage />} />

        <Route path="/recipes" element={<RecipesListPage />} />
        <Route path="/recipes/new" element={<NewRecipePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />

        <Route path="/firings" element={<FiringsListPage />} />
        <Route path="/firings/new" element={<NewFiringPage />} />
        <Route path="/firings/:id" element={<FiringDetailPage />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route
          path="/admin"
          element={
            <RequireOwner>
              <AdminPage />
            </RequireOwner>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
