import React, { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { initializeDatabase } from "./schema";
import { seedCategories } from "./seed";
import type { SQLiteDatabase } from "expo-sqlite";

const DB_NAME = "memento-mori.db";

async function onInit(db: SQLiteDatabase) {
  await initializeDatabase(db);
  await seedCategories(db);
}

function LoadingFallback() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F0F", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SQLiteProvider databaseName={DB_NAME} onInit={onInit}>
        {children}
      </SQLiteProvider>
    </Suspense>
  );
}

export function useDB() {
  return useSQLiteContext();
}
