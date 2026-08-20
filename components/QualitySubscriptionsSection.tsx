'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type ComplaintItem = {
  label?: string;
  name?: string;
  value?: number;
  count?: number;
};

type SubscriptionItem = {
  label?: string;
  name?: string;
  value?: number;
  count?: number;
};

type QualitySubscriptionsSectionProps = {
  complaintsByReason: ComplaintItem[];
  subscriptionBreakdown: SubscriptionItem[];
};

const ORANGE = '#F26A21';
const LIGHT_ORANGE = '#F6A078';

const getLabel = (item: ComplaintItem | SubscriptionItem) =>
  item.label ?? item.name ?? '';

const getValue = (item: ComplaintItem | SubscriptionItem) =>
  Number(item.value ?? item.count ?? 0);

const complaintIcons: Record<string, string> = {
  'Food Quality': '▣',
  'Late Delivery': '♧',
  'Rider Behavior': '♙',
  'Wrong Item': '✂',
  'Refund/Payment': '$',
};

export default function QualitySubscriptionsSection({
  complaintsByReason,
  subscriptionBreakdown,
}: QualitySubscriptionsSectionProps) {
  const complaints = useMemo(
    () =>
      [...(complaintsByReason ?? [])]
        .map((item) => ({
          label: getLabel(item),
          value: getValue(item),
        }))
        .filter((item) => item.label && item.value > 0)
        .sort((a, b) => b.value - a.value),
    [complaintsByReason]
  );

  const subscriptions = useMemo(
    () =>
      [...(subscriptionBreakdown ?? [])]
        .map((item) => ({
          name: getLabel(item),
          value: getValue(item),
        }))
        .filter((item) => item.name && item.value > 0),
    [subscriptionBreakdown]
  );

  const subscriptionTotal = subscriptions.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const subscriptionPercent =
    subscriptionTotal > 0
      ? Math.round(
          ((subscriptions.find((item) =>
            item.name.toLowerCase().includes('subscription')
          )?.value ?? 0) /
            subscriptionTotal) *
            100
        )
      : 0;

  const nonSubscriptionPercent =
    subscriptionTotal > 0 ? 100 - subscriptionPercent : 0;

  const topComplaint = complaints[0];

  return (
    <section>
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E96A2C]">
          Quality
        </p>

        <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.4px] text-[#172033]">
          Complaints &amp; subscriptions
        </h2>

        <p className="mt-1 text-[13px] text-[#747C91]">
          Understand customer concerns and subscription order trends
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Complaints */}
        <div className="rounded-[18px] border border-[#E9E4DF] bg-white p-5 shadow-[0_5px_18px_rgba(25,25,25,0.045)]">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#FBE0D1] bg-[#FFF4ED] text-[19px] font-bold text-[#F26A21]">
                !
              </div>

              <div>
                <h3 className="text-[16px] font-semibold text-[#172033]">
                  Complaints by Reason
                </h3>
                <p className="mt-0.5 text-[11px] text-[#8991A2]">
                  Most common customer concerns
                </p>
              </div>
            </div>

            <span className="rounded-lg border border-[#E8E8EA] bg-white px-3 py-2 text-[11px] font-medium text-[#4B5567]">
              All Time
            </span>
          </div>

          {complaints.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-[#8991A2]">
              No complaint data available.
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.slice(0, 6).map((item, index) => {
                const maxValue = complaints[0]?.value || 1;
                const width = Math.max(
                  8,
                  (item.value / maxValue) * 100
                );

                return (
                  <div key={`${item.label}-${index}`}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF5EF] text-[13px] font-semibold text-[#E96A2C]">
                          {complaintIcons[item.label] ?? '•'}
                        </div>

                        <span className="truncate text-[13px] font-medium text-[#283244]">
                          {item.label}
                        </span>
                      </div>

                      <span className="ml-3 text-[13px] font-semibold text-[#283244]">
                        {item.value.toLocaleString()}
                      </span>
                    </div>

                    <div className="ml-[42px] h-[7px] overflow-hidden rounded-full bg-[#F5F0EC]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          background:
                            'linear-gradient(90deg, #F26A21 0%, #F47B3A 100%)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 border-t border-[#F0ECE8] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8991A2]">
                Total complaints
              </span>
              <span className="text-[13px] font-semibold text-[#172033]">
                {complaints
                  .reduce((sum, item) => sum + item.value, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="rounded-[18px] border border-[#E9E4DF] bg-white p-5 shadow-[0_5px_18px_rgba(25,25,25,0.045)]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#FBE0D1] bg-[#FFF4ED] text-[19px] font-bold text-[#F26A21]">
                ↻
              </div>

              <div>
                <h3 className="text-[16px] font-semibold text-[#172033]">
                  Subscription Orders
                </h3>
                <p className="mt-0.5 text-[11px] text-[#8991A2]">
                  Subscription vs non-subscription
                </p>
              </div>
            </div>

            <span className="rounded-lg border border-[#E8E8EA] bg-white px-3 py-2 text-[11px] font-medium text-[#4B5567]">
              All Time
            </span>
          </div>

          <div className="relative h-[245px]">
            {subscriptionTotal === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-[#8991A2]">
                No subscription data available.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptions}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={91}
                      paddingAngle={2}
                      stroke="#FFFFFF"
                      strokeWidth={3}
                    >
                      {subscriptions.map((_, index) => (
                        <Cell
                          key={`subscription-${index}`}
                          fill={index === 0 ? ORANGE : LIGHT_ORANGE}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #EEE7E2',
                        boxShadow:
                          '0 8px 20px rgba(20,25,35,0.08)',
                        fontSize: 11,
                      }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                  <span className="text-[25px] font-bold leading-7 text-[#172033]">
                    {subscriptionTotal.toLocaleString()}
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-[#8991A2]">
                    Total Orders
                  </span>
                </div>

                <div className="absolute left-[13%] top-[19%] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#F26A21]" />
                  <span className="text-[16px] font-semibold text-[#F26A21]">
                    {subscriptionPercent}%
                  </span>
                </div>

                <div className="absolute bottom-[14%] right-[11%] flex items-center gap-2">
                  <span className="text-[16px] font-semibold text-[#F3A17C]">
                    {nonSubscriptionPercent}%
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#F6A078]" />
                </div>
              </>
            )}
          </div>

          <div className="flex min-h-[48px] items-center justify-center gap-8 rounded-[12px] border border-[#EEECEF] bg-[#FBFCFD] px-4">
            {subscriptions.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-2"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      index === 0 ? ORANGE : LIGHT_ORANGE,
                  }}
                />

                <span className="text-[12px] font-medium text-[#475064]">
                  {item.name}
                </span>

                <span className="text-[11px] font-semibold text-[#747C91]">
                  ({item.value.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight */}
      {topComplaint && (
        <div className="mt-4 flex items-center gap-4 rounded-[16px] border border-[#F1E4DB] bg-[#FFFCFA] px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1E8] text-[18px] text-[#F26A21]">
            ✦
          </div>

          <div className="h-8 w-px bg-[#E8DED7]" />

          <div>
            <p className="text-[12px] font-semibold text-[#172033]">
              Insight
            </p>

            <p className="mt-0.5 text-[12px] text-[#596377]">
              {topComplaint.label} is currently the top complaint
              reason with {topComplaint.value.toLocaleString()} cases.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}