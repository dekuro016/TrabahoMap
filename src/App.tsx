import Layout from "./components/Layout";
import { Empty } from "./components/Bits";
import { useRoute } from "./lib/router";
import Admin from "./pages/Admin";
import Board from "./pages/Board";
import Dashboard from "./pages/Dashboard";
import GigDetail from "./pages/GigDetail";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import Prices from "./pages/Prices";
import JobDetail from "./pages/JobDetail";
import Jobs from "./pages/Jobs";
import MapPage from "./pages/MapPage";
import Policies from "./pages/Policies";
import Profile from "./pages/Profile";
import Post from "./pages/Post";
import PostJob from "./pages/PostJob";
import WorkerProfile from "./pages/WorkerProfile";
import Workers from "./pages/Workers";

export default function App() {
  const [page, id] = useRoute();

  let content;
  switch (page) {
    case undefined:
      content = <Home />;
      break;
    case "map":
      content = <MapPage />;
      break;
    case "post":
      content = <Post />;
      break;
    case "board":
      content = <Board />;
      break;
    case "jobs":
      content = id === "new" ? <PostJob /> : id ? <JobDetail key={id} id={id} /> : <Jobs />;
      break;
    case "workers":
      content = id ? <WorkerProfile key={id} id={id} /> : <Workers />;
      break;
    case "gigs":
      content = <GigDetail key={id} id={id} />;
      break;
    case "dashboard":
      content = <Dashboard />;
      break;
    case "admin":
      content = <Admin />;
      break;
    case "profile":
      content = <Profile />;
      break;
    case "inbox":
      content = <Inbox />;
      break;
    case "prices":
      content = <Prices />;
      break;
    case "policies":
      content = <Policies section={id} />;
      break;
    default:
      content = <Empty title="Page not found" />;
  }

  const route = page ? `/${page}${page === "jobs" && id === "new" ? "/new" : ""}` : "/";
  return <Layout route={route}>{content}</Layout>;
}
