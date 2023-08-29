import { MarketAppCard, fetchAppList } from "@illa-public/market-app"
import {
  PRODUCT_SORT_BY,
  ProductMarketApp,
} from "@illa-public/market-app/service/interface"
import { FC, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { Loading, LoadingIcon, useMessage } from "@illa-design/react"
import { EmptySearchResult } from "@/page/App/components/EmptySearchResult"
import {
  cardListContainerStyle,
  cardListStyle,
  fallbackLoadingStyle,
  loadingStyle,
} from "./style"

export const MarketApps: FC = () => {
  const { t } = useTranslation()

  const [searchParams] = useSearchParams()

  const message = useMessage()

  const fetching = useRef<boolean>()
  const page = useRef<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)

  const [marketApps, setMarketApps] = useState<ProductMarketApp[]>([])

  const [updateLoading, setUpdateLoading] = useState<boolean>(true)

  const sort =
    (searchParams.get("sort") as PRODUCT_SORT_BY) ?? PRODUCT_SORT_BY.POPULAR
  const keywords = searchParams.get("keywords") ?? ""

  useEffect(() => {
    setUpdateLoading(true)
    fetchAppList({
      page: 1,
      limit: 40,
      sortedBy: sort as PRODUCT_SORT_BY,
      search: keywords,
    })
      .then((res) => {
        setMarketApps(res.data.products)
        return res.data
      })
      .finally(() => setUpdateLoading(false))
  }, [keywords, sort])

  return updateLoading ? (
    <div css={fallbackLoadingStyle}>
      <LoadingIcon spin={true} />
    </div>
  ) : marketApps.length > 0 ? (
    <div
      css={cardListContainerStyle}
      onScroll={async (event) => {
        const target = event.target as HTMLDivElement
        if (
          target.scrollHeight - target.scrollTop - target.clientHeight <=
          800
        ) {
          if (fetching.current) {
            return
          }
          if (!hasMore) {
            return
          }
          fetching.current = true
          try {
            const marketAppResp = await fetchAppList({
              page: page.current + 1,
              sortedBy: sort,
              limit: 40,
              search: keywords,
            })
            page.current = page.current + 1
            setMarketApps([...marketApps, ...marketAppResp.data.products])
            if (!marketAppResp.data.hasMore) {
              setHasMore(false)
              return
            }
          } catch (e) {
            message.error({
              content: t("dashboard.message.next-page-error"),
            })
          } finally {
            fetching.current = false
          }
        }
      }}
    >
      <div css={cardListStyle}>
        {marketApps.map((product) => (
          <MarketAppCard
            key={product.app.appID}
            app={product.app}
            marketplace={product.marketplace}
          />
        ))}
      </div>
      {hasMore && <Loading css={loadingStyle} />}
    </div>
  ) : (
    <EmptySearchResult desc={t("dashboard.no-result")} />
  )
}

MarketApps.displayName = "MarketApps"
