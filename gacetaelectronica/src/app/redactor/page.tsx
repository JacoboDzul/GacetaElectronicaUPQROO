"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, Loader2 } from "lucide-react"
import ArticleEditor from "@/components/redactor/ArticleEditor"
import MyArticles from "@/components/redactor/MyArticles"
import PrivateHeader from "@/components/PrivateHeader"
import { useInitializeUser } from "@/hooks/useInitializeUser"

interface ArticleStats {
  published: number
  pending: number
}

export default function Page() {
  useInitializeUser("Redactor")
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<ArticleStats>({
    published: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)

  // Función para obtener estadísticas de artículos del usuario
  const loadArticleStats = async () => {
    try {
      setLoading(true)
      
      // Usar ID fijo del usuario (Carmen Ríos)
      const userId = 5
      
      // Obtener artículos del usuario
      const response = await fetch(`/api/articuloUsuario?usuarioId=${userId}`)
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const userArticles = await response.json()
      
      // Obtener detalles completos de cada artículo para contar estados
      const articlesWithDetails = await Promise.all(
        userArticles.map(async (article: any) => {
          try {
            const articleResponse = await fetch(`/api/articulos?id=${article.idArticulo}`)
            if (articleResponse.ok) {
              return await articleResponse.json()
            }
            return null
          } catch (error) {
            console.error('Error al obtener detalles del artículo:', error)
            return null
          }
        })
      )

      // Filtrar artículos válidos y contar por estado
      const validArticles = articlesWithDetails.filter(article => article !== null)
      
      const published = validArticles.filter((article: any) => article.Estatus === 3).length
      const pending = validArticles.filter((article: any) => article.Estatus === 1).length

      setStats({
        published,
        pending
      })
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticleStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <PrivateHeader />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Panel de Redacción</h1>
          <p className="text-muted-foreground">Crea y gestiona tus artículos para la gaceta electrónica</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="new-article">Nuevo Artículo</TabsTrigger>
            <TabsTrigger value="my-articles">Mis Artículos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 justify-center">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Artículos Publicados</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.published}</div>
                    <p className="text-xs text-muted-foreground">En total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">Pendientes de aprobación</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new-article">
            <ArticleEditor />
          </TabsContent>

          <TabsContent value="my-articles">
            <MyArticles />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
