// File: app/(admin)/admin/settings/marketing-settings/_components/profiles-table.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Mail, Phone, MapPin, ArrowRight, ArrowLeft, Search } from "lucide-react";
import { getKlaviyoProfiles } from "@/app/actions/admin/settings/marketing-settings/klaviyo/get-profiles";
import { KlaviyoProfile } from "@/app/actions/admin/settings/marketing-settings/klaviyo/klaviyo";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function KlaviyoProfilesTable() {
  const [profiles, setProfiles] = useState<KlaviyoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cursorStack, setCursorStack] = useState<string[]>([]); // To handle "Previous"
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch Function
  const fetchProfiles = (cursor?: string, searchTerm?: string) => {
    setLoading(true);
    startTransition(async () => {
      const result = await getKlaviyoProfiles({ cursor, search: searchTerm });
      if (result.success && result.profiles) {
        setProfiles(result.profiles);
        setNextCursor(result.nextCursor || null);
      } else {
        toast.error(result.message || "Failed to load profiles");
        setProfiles([]);
      }
      setLoading(false);
    });
  };

  // Initial Load
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Handlers
  const handleSearch = () => {
    setCursorStack([]); // Reset pagination on search
    fetchProfiles(undefined, search);
  };

  const handleNext = () => {
    if (nextCursor) {
      setCursorStack([...cursorStack, nextCursor]); // Save current history
      fetchProfiles(nextCursor, search);
    }
  };

  // Note: Klaviyo V3 Prev cursor logic is tricky, usually we reset or go back to start
  // For simplicity, we can implement "Reset" instead of Prev if API doesn't give simple prev link
  const handleReset = () => {
    setCursorStack([]);
    setSearch("");
    fetchProfiles();
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-md">
        <Input 
          placeholder="Search by email..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="secondary" onClick={handleSearch} disabled={loading}>
          <Search className="w-4 h-4" />
        </Button>
        {(search || cursorStack.length > 0) && (
            <Button variant="ghost" onClick={handleReset}>Reset</Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile Info</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin inline" /> Loading Klaviyo Data...
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No profiles found.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium flex items-center gap-2">
                        {profile.attributes.email || "No Email"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                         {profile.attributes.first_name} {profile.attributes.last_name}
                      </span>
                      {profile.attributes.phone_number && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {profile.attributes.phone_number}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                        {profile.attributes.location?.city && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                {profile.attributes.location.city}, {profile.attributes.location.country}
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                            Timezone: {profile.attributes.location?.timezone || "N/A"}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Example Logic: If phone exists, show SMS Active */}
                    {profile.attributes.phone_number ? (
                        <Badge variant="outline" className="text-xs">SMS & Email</Badge>
                    ) : (
                        <Badge variant="secondary" className="text-xs">Email Only</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                        View History
                    </Button>
                    {/* This is where we will hook up the Abandoned Email later */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={cursorStack.length === 0 || loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          First Page
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!nextCursor || loading}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}