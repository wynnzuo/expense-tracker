import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_APP = PROJECT_ROOT / "backend" / "app"


class AgentStructureTest(unittest.TestCase):
    def test_agent_module_layout_exists(self) -> None:
        """Verify the new deepagents-based agent module structure."""
        expected_paths = [
            BACKEND_APP / "agent" / "__init__.py",
            BACKEND_APP / "agent" / "agent.py",
            BACKEND_APP / "agent" / "tools.py",
            BACKEND_APP / "agent" / "models.py",
            BACKEND_APP / "agent" / "llm.py",
            BACKEND_APP / "agent" / "services" / "__init__.py",
            BACKEND_APP / "agent" / "services" / "agent_service.py",
        ]

        missing_paths = [path for path in expected_paths if not path.exists()]
        self.assertEqual([], missing_paths, f"Missing expected agent files: {missing_paths}")

    def test_old_graph_files_removed(self) -> None:
        """Verify old LangGraph files have been removed."""
        removed_paths = [
            BACKEND_APP / "agent" / "graph.py",
            BACKEND_APP / "agent" / "graph_builder.py",
            BACKEND_APP / "agent" / "graph_state.py",
            BACKEND_APP / "agent" / "prompts.py",
            BACKEND_APP / "agent" / "nodes" / "input_node.py",
            BACKEND_APP / "agent" / "nodes" / "intent_node.py",
            BACKEND_APP / "agent" / "nodes" / "parse_node.py",
            BACKEND_APP / "agent" / "nodes" / "validate_node.py",
            BACKEND_APP / "agent" / "nodes" / "persist_node.py",
        ]

        existing_paths = [path for path in removed_paths if path.exists()]
        self.assertEqual([], existing_paths, f"Old files still present: {existing_paths}")
