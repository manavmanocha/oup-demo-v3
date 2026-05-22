
  # Assessment Workflow Platform

  This is a code bundle for Assessment Workflow Platform. The original project is available at https://www.figma.com/design/iWWfc51MzKfQXPjQIMahDc/Assessment-Workflow-Platform.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Figma MCP in VS Code

  This repo now includes a workspace MCP config in `.vscode/mcp.json` for the remote Figma MCP server.

  To use it in VS Code:

  1. Open this workspace.
  2. Open the Command Palette and run `MCP: Open Workspace Folder MCP Configuration` if you want to inspect the config.
  3. In the MCP view or config editor, start the `figma` server.
  4. Complete the Figma OAuth flow in the browser when prompted.

  Notes:

  - The shared server definition is committed to the repo so teammates do not need to recreate it.
  - Authentication is user-specific and cannot be safely committed; each teammate must authorize Figma once on their own machine.
  - The configured remote endpoint is `https://mcp.figma.com/mcp`, which is the recommended Figma setup.
  