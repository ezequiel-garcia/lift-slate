import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FaqAccordionItem } from "@/components/faq/FaqAccordionItem";
import { colors } from "@/lib/theme";

type FaqCategory = {
  title: string;
  icon: string;
  items: { question: string; answer: string }[];
};

const FAQ_DATA: FaqCategory[] = [
  {
    title: "Getting Started",
    icon: "rocket-outline",
    items: [
      {
        question: "What is a 1RM and how do I add one?",
        answer:
          "A 1RM (one-rep max) is the maximum weight you can lift for a single repetition. Tap any exercise on the My Lifts tab, then tap 'Add Max' to log your current best. LiftSlate stores it and uses it to auto-calculate training weights.",
      },
      {
        question: "Can I add custom exercises?",
        answer:
          "Yes. On the My Lifts tab, tap the '+' button and choose 'New Exercise'. Custom exercises are private to your account. Default exercises (Squat, Bench, Deadlift, etc.) are always available to everyone.",
      },
      {
        question: "How does LiftSlate track my progress over time?",
        answer:
          "Every time you log a new max, LiftSlate keeps the full history. Open any exercise to see a timeline of your PRs and how your strength has evolved.",
      },
    ],
  },
  {
    title: "Calculator",
    icon: "calculator-outline",
    items: [
      {
        question: "How does the percentage calculator work?",
        answer:
          "Enter any exercise and a target percentage (e.g. 75%). LiftSlate multiplies your current 1RM by that percentage and gives you a practical training weight. Use it to plan warm-up sets or working weights for the day.",
      },
      {
        question: "Can I use lbs instead of kg?",
        answer:
          "Yes. Go to Profile → Units & Weights and switch your unit preference to lbs. All weights are stored in kg internally and converted for display, so you can switch back at any time without losing data.",
      },
    ],
  },
  {
    title: "Gym & Coaches",
    icon: "fitness-outline",
    items: [
      {
        question: "How do I join a gym?",
        answer:
          "Ask your coach or gym admin for an invite link or an 8-character code. Open the Gym tab, tap 'Join a Gym', and use the link or code. You can only be a member of one gym at a time.",
      },
      {
        question: "How do I create a gym?",
        answer:
          "On the Gym tab, tap 'Create a Gym'. You'll become the admin and can invite athletes and coaches.",
      },
      {
        question: "What can a coach do?",
        answer:
          "Coaches can view athlete maxes, log new maxes on behalf of athletes (if the athlete allows it), and publish workouts with percentage-based programming for the whole gym.",
      },
      {
        question: "What does 'Allow Coach Edits' mean?",
        answer:
          "When enabled, coaches in your gym can add or update your 1RMs — useful when your coach tests you in person. You can toggle this off in Profile → Gym if you prefer to manage your own maxes.",
      },
      {
        question: "How do invite codes work?",
        answer:
          "There are two types: a permanent invite link and a temporary 8-character code that expires after 2 hours. Admins can generate a new temporary code from gym settings at any time.",
      },
    ],
  },
  {
    title: "Account & Data",
    icon: "shield-checkmark-outline",
    items: [
      {
        question: "Is my data private?",
        answer:
          "Your maxes and profile are private by default. Coaches in your gym may be able to view your training data based on your gym role and permissions. 'Allow Coach Edits' controls whether coaches can edit your maxes.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Go to Profile → Danger Zone → Delete Account. This permanently removes your account and all associated data. If you're a gym owner, you must transfer or delete the gym first.",
      },
      {
        question: "How do I contact support?",
        answer:
          "Tap 'Contact Support' in Profile → Legal, or email liftslate.support@gmail.com. We typically reply within 1–2 business days.",
      },
    ],
  },
];

export default function FaqScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "",
          headerShown: true,
          headerTransparent: true,
          headerBackTitle: "Profile",
          headerTintColor: colors.accent,
        }}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-14 pb-1">
          <Text
            style={{
              fontFamily: "CormorantGaramond-Regular",
              fontSize: 56,
              lineHeight: 58,
              color: colors.foreground,
              letterSpacing: -1,
            }}
          >
            FAQ
          </Text>
          <Text className="text-muted text-[14px] mt-1">
            Common questions about LiftSlate
          </Text>
        </View>

        {FAQ_DATA.map((category) => (
          <View key={category.title}>
            <SectionHeader title={category.title} icon={category.icon as any} />
            <Card className="mx-5">
              {category.items.map((item, index) => (
                <FaqAccordionItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                  isLast={index === category.items.length - 1}
                />
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
