import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Library } from "./components/Library";
import { IngestItems } from "./components/IngestItems";
import { ItemBankOverview } from "./components/ItemBankOverview";
import { ItemBankCEFRLevel } from "./components/ItemBankCEFRLevel";
import { ItemDetail } from "./components/ItemDetail";
import { Taxonomies } from "./components/Taxonomies";
import { TaxonomyDetail } from "./components/TaxonomyDetail";
import { Workflows } from "./components/Workflows";
import { PreTestingPipeline } from "./components/PreTestingPipeline";
import { Screening } from "./components/Screening";
import { DifficultyPrediction } from "./components/DifficultyPrediction";
import { Seeding } from "./components/Seeding";
import { ReviewQueue } from "./components/ReviewQueue";
import { ScreenItems } from "./components/ScreenItems";
import { PredictDifficulty } from "./components/PredictDifficulty";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Library },
      { path: "library", Component: Library },
      { path: "library/ingest", Component: IngestItems },
      { path: "item-bank", Component: ItemBankOverview },
      { path: "item-bank/:level", Component: ItemBankCEFRLevel },
      { path: "item-bank/:level/:itemId", Component: ItemDetail },
      { path: "taxonomies", Component: Taxonomies },
      { path: "taxonomies/:taxonomyId", Component: TaxonomyDetail },
      { path: "workflows", Component: Workflows },
      { path: "workflows/pre-testing-pipeline", Component: ItemBankOverview },
      { path: "workflows/pre-testing-pipeline/stages", Component: PreTestingPipeline },
      { path: "workflows/pre-testing-pipeline/screening", Component: Screening },
      { path: "workflows/pre-testing-pipeline/screening/start", Component: ScreenItems },
      { path: "workflows/pre-testing-pipeline/difficulty-prediction", Component: DifficultyPrediction },
      { path: "workflows/pre-testing-pipeline/difficulty-prediction/start", Component: PredictDifficulty },
      { path: "workflows/pre-testing-pipeline/seeding", Component: Seeding },
      { path: "review-queue", Component: ReviewQueue },
    ],
  },
]);
