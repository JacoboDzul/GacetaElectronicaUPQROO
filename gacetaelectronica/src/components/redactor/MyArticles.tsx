"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Eye, Edit, Trash2, Loader2 } from "lucide-react"
import FilterSearchBar from "@/components/FilterSearchBar"
import { useUser } from "@/contexts/UserContext"

interface Articulo {
  IdArticulo: number;
  Titulo: string;
  Resumen: string;
  Contenido: string;
  Estatus: number;
  FechaCreacion: string;
  FechaRevision?: string;
  Comentario?: string;
  IdCategoria: number;
  IdAutor: number;
  IdRevisor?: number;
  Categoria?: {
    IdCategoria: number;
    Nombre: string;
  };
}

const getStatusBadge = (status: number) => {
  switch (status) {
    case 1:
      return <Badge className="bg-yellow-100 text-yellow-800">En Revisión</Badge>
    case 2:
      return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>
    case 3:
      return <Badge className="bg-green-100 text-green-800">Publicado</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-800">Desconocido</Badge>
  }
}

const getStatusText = (status: number) => {
  switch (status) {
    case 1:
      return "En Revisión"
    case 2:
      return "Rechazado"
    case 3:
      return "Publicado"
    default:
      return "Desconocido"
  }
}

export default function MyArticles() {
  const { user } = useUser()
  const [articles, setArticles] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("category")
  const [filterValue, setFilterValue] = useState("all")
  const [selectedArticle, setSelectedArticle] = useState<Articulo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Función para obtener el ID del usuario por email
  // const getUserIdByEmail = async (email: string) => {
  //   try {
  //     const response = await fetch(`/api/usuarios?email=${encodeURIComponent(email)}`)
  //     if (!response.ok) {
  //       throw new Error('Error al obtener información del usuario')
  //     }
  //     const userData = await response.json()
  //     return userData.IdUsuarios
  //   } catch (error) {
  //     console.error('Error al obtener ID del usuario:', error)
  //     return null
  //   }
  // }

  // Función para cargar artículos del usuario
  const loadUserArticles = async () => {
    if (!user?.email) {
      setError('No se pudo identificar al usuario')
      setLoading(false)
      return
    }
  


    try {
      setLoading(true)
      setError(null)

      // Usar ID fijo del usuario (Carmen Ríos)
      const userId = 5;
      if (!userId) {
        setError('No se pudo obtener el ID del usuario')
        setLoading(false)
        return
      }

      // Obtener artículos del usuario usando la API articuloUsuario
      const response = await fetch(`/api/articuloUsuario?usuarioId=${userId}`)
      if (!response.ok) {
        throw new Error('Error al cargar los artículos')
      }

      const userArticles = await response.json()
      
      // Para cada artículo, obtener información completa y categoría
      const articlesWithDetails = await Promise.all(
        userArticles.map(async (article: any) => {
          try {
            // Obtener información completa del artículo
            const articleResponse = await fetch(`/api/articulos?id=${article.idArticulo}&include=categoria`)
            if (articleResponse.ok) {
              const articleData = await articleResponse.json()
              return articleData
            }
            return article
          } catch (error) {
            console.error('Error al obtener detalles del artículo:', error)
            return article
          }
        })
      )

      setArticles(articlesWithDetails)
    } catch (error) {
      console.error('Error al cargar artículos:', error)
      setError('Error al cargar los artículos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserArticles()
  }, [user])

  const handleAction = (action: string, title: string) => {
    toast(`${action} artículo`, {
      description: `Acción "${action}" realizada en "${title}"`,
    })
  }

  const handleViewArticle = (article: Articulo) => {
    setSelectedArticle(article)
    setIsDialogOpen(true)
  }

  const handleDeleteArticle = async (articleId: number) => {
    try {
      const response = await fetch(`/api/articulos?id=${articleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el artículo')
      }

      toast('Artículo eliminado', {
        description: 'El artículo ha sido eliminado correctamente',
      })

      // Recargar la lista de artículos
      loadUserArticles()
    } catch (error) {
      console.error('Error al eliminar artículo:', error)
      toast('Error al eliminar', {
        description: 'No se pudo eliminar el artículo',
      })
    }
  }

  const filteredArticles = articles.filter((article) => {
    const matchSearch = article.Titulo.toLowerCase().includes(searchTerm.toLowerCase())
    let matchFilter = true

    if (filterValue !== "all") {
      switch (filterBy) {
        case "category":
          matchFilter = article.Categoria?.Nombre === filterValue
          break
        case "status":
          matchFilter = getStatusText(article.Estatus) === filterValue
          break
        case "createdAt":
          matchFilter = article.FechaCreacion === filterValue
          break
      }
    }

    return matchSearch && matchFilter
  })

  const getFilterOptions = (field: string) => {
    const values = new Set<string>()
    articles.forEach((article) => {
      switch (field) {
        case "category":
          if (article.Categoria?.Nombre) {
            values.add(article.Categoria.Nombre)
          }
          break
        case "status":
          values.add(getStatusText(article.Estatus))
          break
        case "createdAt":
          values.add(article.FechaCreacion)
          break
      }
    })
    return Array.from(values)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Artículos</CardTitle>
          <CardDescription>Cargando tus artículos...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Artículos</CardTitle>
          <CardDescription>Error al cargar los artículos</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadUserArticles}>Reintentar</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Mis Artículos</CardTitle>
            <CardDescription>Gestiona todos tus artículos creados</CardDescription>
          </div>
          <FilterSearchBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filterBy={filterBy}
            onFilterByChange={setFilterBy}
            filterValue={filterValue}
            onFilterValueChange={setFilterValue}
            availableFields={[
              { label: "Categoría", value: "category" },
              { label: "Estado", value: "status" },
              { label: "Fecha", value: "createdAt" }
            ]}
            getFilterValues={getFilterOptions}
          />
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article,index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{article.Titulo}</TableCell>
                  <TableCell className="capitalize">{article.Categoria?.Nombre || 'Sin categoría'}</TableCell>
                  <TableCell>{getStatusBadge(article.Estatus)}</TableCell>
                  <TableCell>{new Date(article.FechaCreacion).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewArticle(article)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {article.Estatus === 2 && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleAction("Editar", article.Titulo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteArticle(article.IdArticulo)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No se encontraron artículos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.Titulo}</DialogTitle>
            <DialogDescription>
              Publicado el {selectedArticle?.FechaCreacion ? new Date(selectedArticle.FechaCreacion).toLocaleDateString('es-ES') : 'Fecha no disponible'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Resumen:</h4>
              <p className="text-sm text-muted-foreground">
                {selectedArticle?.Resumen || "Este artículo no tiene resumen."}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Contenido:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {selectedArticle?.Contenido || "Este artículo no tiene contenido aún."}
              </p>
            </div>
            {selectedArticle?.Comentario && (
              <div className="space-y-2">
                <h4 className="font-semibold">Comentario del revisor:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedArticle.Comentario}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}