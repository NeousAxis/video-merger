
def get_project_actions(project):
  """Retourne les actions recommandées pour un projet."""
  actions = project.get('actions', [])
  if not actions:
    return "Aucune action recommandée pour le moment."

  response = "Actions recommandées :\n"
  for i, action in enumerate(actions, 1):
    response += f"{i}. {action}\n"
  return response
